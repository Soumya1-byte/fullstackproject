import Input from '../ui/Input';
import Select from '../ui/Select';

export default function QuestionEditor({ question, onChange, onDelete }) {
  const supportsOptions = ['MCQ', 'LIKERT'].includes(question.type);
  const options = question.options?.length ? question.options : [''];

  const updateOption = (index, value) => {
    const nextOptions = options.map((option, optionIndex) => (optionIndex === index ? value : option));
    onChange({ ...question, options: nextOptions });
  };

  const addOption = () => {
    onChange({ ...question, options: [...options, ''] });
  };

  const removeOption = (index) => {
    const nextOptions = options.filter((_, optionIndex) => optionIndex !== index);
    onChange({ ...question, options: nextOptions.length ? nextOptions : [''] });
  };

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <Input
        placeholder="Question label"
        value={question.label}
        onChange={(e) => onChange({ ...question, label: e.target.value })}
      />
      <Select value={question.type} onChange={(e) => onChange({ ...question, type: e.target.value })}>
        <option value="MCQ">MCQ</option>
        <option value="RATING">Rating</option>
        <option value="TEXT">Text</option>
        <option value="EMOJI">Emoji</option>
        <option value="LIKERT">Likert</option>
      </Select>
      {supportsOptions && (
        <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Options</p>
          {options.map((option, index) => (
            <div key={`${question.questionId}-option-${index}`} className="flex gap-2">
              <Input
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
              />
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-3 text-xs text-rose-600 transition hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-slate-800"
                onClick={() => removeOption(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs font-medium text-sky-600 transition hover:text-sky-500"
            onClick={addOption}
          >
            Add Option
          </button>
        </div>
      )}
      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={question.required || false}
          onChange={(e) => onChange({ ...question, required: e.target.checked })}
        />
        Required question
      </label>
      <button type="button" className="text-xs text-rose-600" onClick={onDelete}>
        Remove question
      </button>
    </div>
  );
}
