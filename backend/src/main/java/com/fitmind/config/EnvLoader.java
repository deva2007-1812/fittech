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

    private static void normalizeSupabaseConfig() {
        String supabaseUrl = System.getProperty("SUPABASE_DB_URL");
        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            supabaseUrl = System.getenv("SUPABASE_DB_URL");
        }
        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            supabaseUrl = System.getProperty("DB_URL");
        }
        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            supabaseUrl = System.getenv("DB_URL");
        }

        if (supabaseUrl != null && !supabaseUrl.isBlank()) {
            String trimmed = supabaseUrl.trim();

            // Handle Supabase URI with user info: jdbc:postgresql://[user]:[pass]@[host]...
            if (trimmed.startsWith("jdbc:postgresql://") && trimmed.contains("@")) {
                trimmed = trimmed.substring(5); // convert to postgresql:// so URI parser can extract credentials
            }

            // Handle Supabase URI copied directly: postgresql://[user]:[pass]@[host]:[port]/[db]
            if (trimmed.startsWith("postgresql://") || trimmed.startsWith("postgres://")) {
                try {
                    String sanitized = trimmed.replaceFirst("^postgres(ql)?://", "http://");
                    java.net.URI uri = java.net.URI.create(sanitized);
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        if (System.getProperty("SUPABASE_DB_USERNAME") == null && System.getenv("SUPABASE_DB_USERNAME") == null) {
                            System.setProperty("SUPABASE_DB_USERNAME", parts[0]);
                        }
                        if (System.getProperty("SUPABASE_DB_PASSWORD") == null && System.getenv("SUPABASE_DB_PASSWORD") == null) {
                            System.setProperty("SUPABASE_DB_PASSWORD", parts[1]);
                        }
                    }
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = (uri.getPath() != null && !uri.getPath().isBlank() && !uri.getPath().equals("/"))
                            ? uri.getPath()
                            : "/postgres";
                    String query = uri.getQuery();
                    if (query == null || query.isBlank()) {
                        query = "sslmode=require";
                    } else if (!query.contains("sslmode=")) {
                        query += "&sslmode=require";
                    }
                    String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + path + "?" + query;
                    System.setProperty("SUPABASE_DB_URL", jdbcUrl);
                    log.info("Configured Supabase JDBC URL: {}", jdbcUrl.replaceAll("password=[^&]*", "password=***"));
                } catch (Exception e) {
                    if (!trimmed.startsWith("jdbc:")) {
                        System.setProperty("SUPABASE_DB_URL", "jdbc:" + trimmed);
                    }
                }
            } else if (trimmed.startsWith("jdbc:postgresql://")) {
                if ((trimmed.contains("supabase.co") || trimmed.contains("supabase.com")) && !trimmed.contains("sslmode=")) {
                    String sep = trimmed.contains("?") ? "&" : "?";
                    System.setProperty("SUPABASE_DB_URL", trimmed + sep + "sslmode=require");
                }
            }
        }
    }
}
