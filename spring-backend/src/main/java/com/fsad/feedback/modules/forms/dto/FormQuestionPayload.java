package com.fsad.feedback.modules.forms.dto;

import com.fsad.feedback.modules.forms.model.QuestionType;

import java.util.List;

public record FormQuestionPayload(
        String questionId,
        String label,
        QuestionType type,
        boolean required,
        List<String> options,
        Integer scale
) {
}
