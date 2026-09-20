package com.fitmind.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * Automatically loads .env files and normalizes Supabase PostgreSQL connection strings
 * to ensure smooth connection without manual JDBC URI formatting.
 *
 * Supported input formats for SUPABASE_DB_URL:
 *   1. jdbc:postgresql://host:port/db?params              (plain JDBC, no credentials in URL)
 *   2. postgresql://user:pass@host:port/db                (raw Supabase URI)
 *   3. postgres://user:pass@host:port/db                  (alias)
 *   4. jdbc:postgresql://user:pass@host:port/db           (JDBC with embedded credentials)
 *
 * In all cases with embedded credentials the username and password are extracted
 * and set as separate system properties (SUPABASE_DB_USERNAME / SUPABASE_DB_PASSWORD)
 * so that HikariCP / JDBC receive them through the standard datasource.username /
 * datasource.password properties — avoiding the dot-in-username JDBC parsing bug
 * that causes "tenant/user postgres.xxx not found" on Supabase Pooler connections.
 */
public class EnvLoader {

    private static final Logger log = LoggerFactory.getLogger(EnvLoader.class);

    public static void load() {
        Path[] searchPaths = new Path[]{
            Paths.get(".env"),
            Paths.get("backend/.env"),
            Paths.get("../.env"),
            Paths.get("../backend/.env")
        };

        for (Path path : searchPaths) {
            if (Files.exists(path) && Files.isRegularFile(path)) {
                log.info("Loading environment configuration from: {}", path.toAbsolutePath());
                try {
                    List<String> lines = Files.readAllLines(path);
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                            continue;
                        }
                        int eq = trimmed.indexOf('=');
                        if (eq > 0) {
                            String key = trimmed.substring(0, eq).trim();
                            String val = trimmed.substring(eq + 1).trim();
                            if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.substring(1, val.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                    break;
                } catch (Exception e) {
                    log.warn("Could not read {}: {}", path, e.getMessage());
                }
            }
        }
        normalizeSupabaseConfig();
    }

    /**
     * Resolves the effective SUPABASE_DB_URL, normalizes it to a clean JDBC URL
     * (no embedded credentials), and extracts credentials into separate system
     * properties so Spring's datasource.username / datasource.password can pick
     * them up correctly.
     *
     * This prevents the "tenant/user postgres.xxx not found" error that occurs when
     * JDBC tries to parse a URL like:
     *   jdbc:postgresql://postgres.project-ref:password@host:port/db
     * and the driver misinterprets the dot-notation Supabase pooler username.
     */
    private static void normalizeSupabaseConfig() {
        String rawUrl = resolveEnvValue("SUPABASE_DB_URL", "DB_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            log.debug("No SUPABASE_DB_URL or DB_URL found; skipping Supabase normalization.");
            return;
        }

        String url = rawUrl.trim();

        // ── Step 1: strip jdbc: prefix so we can parse as a normal URI ──────────
        // Handles: jdbc:postgresql://user:pass@host:port/db
        //      and jdbc:postgresql://host:port/db
        String parseableUrl = url;
        if (parseableUrl.startsWith("jdbc:")) {
            parseableUrl = parseableUrl.substring(5); // → postgresql://...
        }

        // ── Step 2: parse URI only if it looks like a hierarchical URI ──────────
        if (parseableUrl.startsWith("postgresql://") || parseableUrl.startsWith("postgres://")) {
            try {
                // Replace scheme with http:// so java.net.URI can parse user-info
                // (the postgresql:// scheme is not natively supported by java.net.URI)
                String httpUrl = parseableUrl.replaceFirst("^postgres(ql)?://", "http://");
                java.net.URI uri = java.net.URI.create(httpUrl);

                String extractedUser = null;
                String extractedPass = null;

                String userInfo = uri.getUserInfo(); // e.g. "postgres.project-ref:password"
                if (userInfo != null && !userInfo.isBlank()) {
                    int colon = userInfo.indexOf(':');
                    if (colon > 0) {
                        extractedUser = userInfo.substring(0, colon);
                        extractedPass = userInfo.substring(colon + 1);
                    } else {
                        extractedUser = userInfo;
                    }
                }

                // Also inspect query string for user and password (e.g. from Supabase JDBC tab)
                String rawQuery = uri.getRawQuery();
                java.util.List<String> cleanParams = new java.util.ArrayList<>();
                if (rawQuery != null && !rawQuery.isBlank()) {
                    for (String part : rawQuery.split("&")) {
                        if (part.startsWith("user=")) {
                            if (extractedUser == null) {
                                extractedUser = java.net.URLDecoder.decode(part.substring(5), java.nio.charset.StandardCharsets.UTF_8);
                            }
                        } else if (part.startsWith("password=")) {
                            if (extractedPass == null) {
                                extractedPass = java.net.URLDecoder.decode(part.substring(9), java.nio.charset.StandardCharsets.UTF_8);
                            }
                        } else if (!part.isBlank()) {
                            cleanParams.add(part);
                        }
                    }
                }

                // Set username / password as separate system properties if not already provided
                setIfAbsent("SUPABASE_DB_USERNAME", extractedUser);
                setIfAbsent("SUPABASE_DB_PASSWORD", extractedPass);

                // Ensure sslmode=require is present
                boolean hasSsl = false;
                for (String param : cleanParams) {
                    if (param.startsWith("sslmode=")) {
                        hasSsl = true;
                        break;
                    }
                }
                if (!hasSsl) {
                    cleanParams.add("sslmode=require");
                }

                // Build clean JDBC URL — no credentials embedded
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String dbPath = (uri.getPath() != null && !uri.getPath().isBlank() && !uri.getPath().equals("/"))
                        ? uri.getPath()   // e.g. "/postgres"
                        : "/postgres";
                String finalQuery = String.join("&", cleanParams);

                String cleanJdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + dbPath + (finalQuery.isEmpty() ? "" : "?" + finalQuery);
                System.setProperty("SUPABASE_DB_URL", cleanJdbcUrl);
                log.info("Normalized Supabase JDBC URL: {}", cleanJdbcUrl.replaceAll("password=[^&]*", "password=***"));
                if (extractedUser != null) {
                    log.info("Extracted Supabase username: {}", extractedUser);
                }
                return;

            } catch (IllegalArgumentException e) {
                log.warn("Could not parse Supabase URI '{}': {}. Attempting fallback.", url, e.getMessage());
                // Fall through to Step 3 / Step 4
            }
        }

        // ── Step 3: already jdbc:postgresql://host... with no credentials ────────
        // Just ensure sslmode=require is present for Supabase hosts
        if (url.startsWith("jdbc:postgresql://")) {
            if ((url.contains("supabase.co") || url.contains("supabase.com")) && !url.contains("sslmode=")) {
                String sep = url.contains("?") ? "&" : "?";
                String fixedUrl = url + sep + "sslmode=require";
                System.setProperty("SUPABASE_DB_URL", fixedUrl);
                log.info("Added sslmode=require to Supabase JDBC URL.");
            }
            return;
        }

        // ── Step 4: last resort — prefix with jdbc: if missing ──────────────────
        if (!url.startsWith("jdbc:")) {
            System.setProperty("SUPABASE_DB_URL", "jdbc:" + url);
            log.warn("Prefixed missing jdbc: scheme to SUPABASE_DB_URL.");
        }
    }

    /** Read a value from system properties first, then env vars, across multiple key aliases. */
    private static String resolveEnvValue(String... keys) {
        for (String key : keys) {
            String val = System.getProperty(key);
            if (val != null && !val.isBlank()) return val;
            val = System.getenv(key);
            if (val != null && !val.isBlank()) return val;
        }
        return null;
    }

    /** Set a system property only if neither the system property nor the env var is already set. */
    private static void setIfAbsent(String key, String value) {
        if (value == null || value.isBlank()) return;
        if (System.getProperty(key) == null && System.getenv(key) == null) {
            System.setProperty(key, value);
        }
    }
}
