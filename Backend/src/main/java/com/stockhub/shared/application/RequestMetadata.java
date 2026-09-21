package com.stockhub.shared.application;

/** Technical context of the current request (for audit and security logs). */
public record RequestMetadata(String ipAddress, String userAgent, String requestId) {

    public static final RequestMetadata NONE = new RequestMetadata(null, null, null);
}
