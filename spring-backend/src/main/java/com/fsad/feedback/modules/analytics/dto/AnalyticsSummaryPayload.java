package com.fsad.feedback.modules.analytics.dto;

public record AnalyticsSummaryPayload(
        String formId,
        long responseCount,
        Double avgRating
) {
}
