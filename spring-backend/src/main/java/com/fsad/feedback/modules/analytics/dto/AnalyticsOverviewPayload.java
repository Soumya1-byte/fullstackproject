package com.fsad.feedback.modules.analytics.dto;

import java.util.List;
import java.util.Map;

public record AnalyticsOverviewPayload(
        boolean suppressed,
        String semester,
        List<Map<String, Object>> satisfaction,
        List<Map<String, Object>> distribution,
        List<Map<String, Object>> trends
) {
}
