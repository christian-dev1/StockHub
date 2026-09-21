package com.stockhub.audit.infrastructure.mapper;

import com.stockhub.audit.application.port.JsonSerializer;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

@Component
class JacksonJsonSerializer implements JsonSerializer {

    private final JsonMapper mapper;

    JacksonJsonSerializer(JsonMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public String toJson(Object value) {
        return mapper.writeValueAsString(value);
    }
}
