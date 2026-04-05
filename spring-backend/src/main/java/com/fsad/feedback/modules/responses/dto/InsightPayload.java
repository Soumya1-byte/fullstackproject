package com.fsad.feedback.modules.responses.dto;

import java.util.List;
import java.util.Map;

public record InsightPayload(
        boolean suppressed,
        List<Map<String, Object>> satisfaction,
        List<Map<String, Object>> distribution
) {
}
