package org.traccar.web;

import com.google.inject.Singleton;
import jakarta.inject.Inject;

@Singleton
public class McpServerHolder implements AutoCloseable {
    public static final String PATH = "/api/mcp";
    
    @Inject
    public McpServerHolder() {}
    
    public void close() throws Exception {}
    public jakarta.servlet.http.HttpServlet getServlet() { return null; }
}