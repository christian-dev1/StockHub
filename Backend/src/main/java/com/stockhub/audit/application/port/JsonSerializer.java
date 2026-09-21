package com.stockhub.audit.application.port;

/** Port turning audit values into JSON documents. */
public interface JsonSerializer {

    String toJson(Object value);
}
