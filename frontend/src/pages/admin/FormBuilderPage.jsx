import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import FormBuilderCanvas from '../../components/feedback/FormBuilderCanvas';
import FormPreview from '../../components/feedback/FormPreview';
import Button from '../../components/ui/Button';
import SectionCard from '../../components/ui/SectionCard';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { formService } from '../../services/formService';
import { courseService } from '../../services/courseService';
import { useToast } from '../../hooks/useToast';

export default function FormBuilderPage() {
  const { dashboardSearchQuery = '' } = useOutletContext() || {};
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const { pushToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    courseService
      .list()
      .then((data) => {
        setCourses(data || []);
        if (data?.length) setCourseId(data[0]._id);
      })
      .catch(() => setCourses([]));
  }, []);

  const normalizedQuery = dashboardSearchQuery.trim().toLowerCase();

  const filteredCourses = useMemo(() => {
    if (!normalizedQuery) return courses;
    return courses.filter((course) =>
      [course.code, course.title, course.semester, course.department].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
    );
  }, [courses, normalizedQuery]);

  useEffect(() => {
    if (!filteredCourses.length) {
      setCourseId('');
      return;
    }

    if (!filteredCourses.some((course) => course._id === courseId)) {
      setCourseId(filteredCourses[0]._id);
    }
  }, [courseId, filteredCourses]);

  const onSave = async () => {
    if (!title.trim()) {
      pushToast('Please add a meaningful form title', 'error');
      return;
    }
    if (!courseId) {
      pushToast('Please select a course', 'error');
      return;
    }
    if (!questions.length) {
      pushToast('Add at least one question', 'error');
      return;
    }

    const normalizedQuestions = questions.map((question) => ({
      ...question,
      label: (question.label || '').trim(),
      options: (question.options || []).map((option) => option.trim()).filter(Boolean)
    }));

    const firstInvalid = normalizedQuestions.find((question) => !question.label);
    if (firstInvalid) {
      const index = normalizedQuestions.findIndex((question) => question.questionId === firstInvalid.questionId) + 1;
      pushToast(`Question ${index} is missing a label`, 'error');
      return;
    }

    const invalidOptionsQuestion = normalizedQuestions.find(
      (question) => ['MCQ', 'LIKERT'].includes(question.type) && (question.options?.length || 0) < 2
    );
    if (invalidOptionsQuestion) {
      const index = normalizedQuestions.findIndex((question) => question.questionId === invalidOptionsQuestion.questionId) + 1;
      pushToast(`Question ${index} needs at least 2 options`, 'error');
      return;
    }

    try {
      await formService.create({
        title: title.trim(),
        description: description.trim(),
        courseId,
        questions: normalizedQuestions,
        status: 'DRAFT'
      });
      pushToast('Form saved as draft', 'success');
      navigate('/admin/forms');
    } catch (error) {
      const apiError = error.response?.data?.error;
      const fieldErrors = apiError?.details?.fieldErrors;
      const firstFieldError = fieldErrors ? Object.values(fieldErrors).flat().find(Boolean) : null;
      pushToast(firstFieldError || apiError?.message || 'Could not save form', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Form Studio</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">Create and Assign High-Quality Feedback Forms</h1>
        <p className="max-w-2xl text-sm text-[var(--text-muted)]">
          Build detailed question sets, connect them to courses, and publish after reviewing structure and clarity.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Form Builder" subtitle="Design question flow with clear intent and coverage">
          <div className="mb-4 space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Form title" />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the goal of this form" />
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {!filteredCourses.length && <option value="">{normalizedQuery ? 'No matching courses' : 'No courses available. Create one in Courses.'}</option>}
              {filteredCourses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </Select>
          </div>
          <FormBuilderCanvas questions={questions} setQuestions={setQuestions} />
          <Button className="mt-4" onClick={onSave} type="button">
            Save Draft
          </Button>
        </SectionCard>
        <FormPreview title={title} questions={questions} />
      </div>
    </div>
  );
}
