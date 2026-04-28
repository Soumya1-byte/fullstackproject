import QuestionEditor from './QuestionEditor';
import Button from '../ui/Button';

export default function FormBuilderCanvas({ questions, setQuestions, searchQuery = '' }) {
  const addQuestion = () => {
    setQuestions((prev) => [...prev, { questionId: crypto.randomUUID(), label: '', type: 'TEXT', options: [] }]);
  };

  const updateQuestion = (index, payload) => {
    setQuestions((prev) => prev.map((item, i) => (i === index ? payload : item)));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleQuestions = normalizedQuery
    ? questions
        .map((question, index) => ({ question, index }))
        .filter(({ question }) =>
          [question.label, question.type, ...(question.options || [])].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
        )
    : questions.map((question, index) => ({ question, index }));

  return (
    <div className="space-y-3">
      {visibleQuestions.map(({ question, index }) => (
        <QuestionEditor
          key={question.questionId}
          question={question}
          onChange={(payload) => updateQuestion(index, payload)}
          onDelete={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
        />
      ))}
      {normalizedQuery && !visibleQuestions.length ? (
        <div className="rounded-2xl border border-dashed border-[var(--line-soft)] p-4 text-sm text-[var(--text-muted)]">
          No questions match the current search.
        </div>
      ) : null}
      <Button onClick={addQuestion} type="button">
        Add Question
      </Button>
    </div>
  );
}
