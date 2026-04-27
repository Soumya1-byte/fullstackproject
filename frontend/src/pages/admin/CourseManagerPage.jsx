import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Plus, Users } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SectionCard from '../../components/ui/SectionCard';
import EmptyState from '../../components/ui/EmptyState';
import { courseService } from '../../services/courseService';
import { userService } from '../../services/userService';
import { useToast } from '../../hooks/useToast';

function toggleId(ids, id) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export default function CourseManagerPage() {
  const { dashboardSearchQuery = '' } = useOutletContext() || {};
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [creating, setCreating] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [newCourse, setNewCourse] = useState({ code: '', title: '', semester: '', department: '' });
  const { pushToast } = useToast();

  const loadData = async () => {
    const [courseData, studentData] = await Promise.all([courseService.list(), userService.listStudents()]);
    const allCourses = courseData || [];
    setCourses(allCourses);
    setStudents(studentData || []);

    const initialCourseId = selectedCourseId || allCourses[0]?._id || '';
    setSelectedCourseId(initialCourseId);
    const initial = allCourses.find((course) => course._id === initialCourseId);
    setSelectedStudentIds((initial?.assignedStudentIds || []).map(String));
  };

  useEffect(() => {
    loadData().catch(() => {
      setCourses([]);
      setStudents([]);
    });
  }, []);

  useEffect(() => {
    const selected = courses.find((course) => course._id === selectedCourseId);
    setSelectedStudentIds((selected?.assignedStudentIds || []).map(String));
  }, [selectedCourseId, courses]);

  const normalizedQuery = dashboardSearchQuery.trim().toLowerCase();

  const matchingCourses = useMemo(() => {
    if (!normalizedQuery) return courses;
    return courses.filter((course) =>
      [course.code, course.title, course.semester, course.department].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
    );
  }, [courses, normalizedQuery]);

  const filteredStudents = useMemo(() => {
    if (!normalizedQuery) return students;
    return students.filter((student) =>
      [student.name, student.email].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
    );
  }, [students, normalizedQuery]);

  const filteredCourses = normalizedQuery && !matchingCourses.length && filteredStudents.length ? courses : matchingCourses;
  const hasSearchMatches = courses.length > 0 && (filteredCourses.length || filteredStudents.length);

  useEffect(() => {
    if (!filteredCourses.length) {
      setSelectedCourseId('');
      return;
    }

    if (!filteredCourses.some((course) => course._id === selectedCourseId)) {
      setSelectedCourseId(filteredCourses[0]._id);
    }
  }, [filteredCourses, selectedCourseId]);

  const selectedCourse = useMemo(() => filteredCourses.find((course) => course._id === selectedCourseId), [filteredCourses, selectedCourseId]);

  const onCreateCourse = async () => {
    if (!newCourse.code || !newCourse.title || !newCourse.semester || !newCourse.department) {
      pushToast('Fill course code, title, semester, and department', 'error');
      return;
    }

    setCreating(true);
    try {
      const created = await courseService.create(newCourse);
      pushToast('Course created', 'success');
      setNewCourse({ code: '', title: '', semester: '', department: '' });
      await loadData();
      setSelectedCourseId(created._id);
    } catch (error) {
      pushToast(error.response?.data?.error?.message || 'Could not create course', 'error');
    } finally {
      setCreating(false);
    }
  };

  const onSaveAssignments = async () => {
    if (!selectedCourseId) return;
    setSavingAssignments(true);
    try {
      await courseService.assignStudents(selectedCourseId, selectedStudentIds);
      pushToast('Student assignment updated', 'success');
      await loadData();
    } catch (error) {
      pushToast(error.response?.data?.error?.message || 'Could not update assignments', 'error');
    } finally {
      setSavingAssignments(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Course Administration</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">Create Courses and Assign Students</h1>
        <p className="max-w-2xl text-sm text-[var(--text-muted)]">
          Course enrollment controls which published forms each student can submit. Build clean assignments before publishing forms.
        </p>
      </header>

      <SectionCard title="Create New Course" subtitle="Add rich course metadata for precise form allocation">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input placeholder="Code (e.g. CSE101)" value={newCourse.code} onChange={(e) => setNewCourse((prev) => ({ ...prev, code: e.target.value }))} />
          <Input placeholder="Course title" value={newCourse.title} onChange={(e) => setNewCourse((prev) => ({ ...prev, title: e.target.value }))} />
          <Input placeholder="Semester" value={newCourse.semester} onChange={(e) => setNewCourse((prev) => ({ ...prev, semester: e.target.value }))} />
          <Input placeholder="Department" value={newCourse.department} onChange={(e) => setNewCourse((prev) => ({ ...prev, department: e.target.value }))} />
        </div>
        <div className="mt-4">
          <Button type="button" onClick={onCreateCourse} disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? 'Creating...' : 'Create Course'}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Assign Students" subtitle="Students can submit only forms from courses they are enrolled in">
        {!hasSearchMatches ? (
          <EmptyState
            icon={BookOpenCheck}
            title={normalizedQuery ? 'No matching courses or students' : 'No courses available'}
            description={
              normalizedQuery
                ? 'Try a different course code, title, semester, department, student name, or student email.'
                : 'Create a course first, then assign students and publish forms.'
            }
          />
        ) : (
          <div className="space-y-4">
            <Select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
              {filteredCourses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.code} - {course.title} ({course.semester})
                </option>
              ))}
            </Select>

            <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-elevated)] p-4">
              <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Users className="h-4 w-4 text-[var(--brand-500)]" />
                {selectedCourse ? `Enrolled in ${selectedCourse.code}` : 'Enrolled Students'}
              </p>

              <div className="grid gap-2 md:grid-cols-2">
                {filteredStudents.map((student) => {
                  const checked = selectedStudentIds.includes(String(student._id));
                  return (
                    <label key={student._id} className="flex items-center gap-2 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-card)] px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setSelectedStudentIds((prev) => toggleId(prev, String(student._id)))}
                        className="h-4 w-4 rounded border-[var(--line-soft)]"
                      />
                      <span className="font-medium text-[var(--text-primary)]">{student.name}</span>
                      <span className="ml-auto text-xs text-[var(--text-muted)]">{student.email}</span>
                    </label>
                  );
                })}
              </div>
              {!filteredStudents.length ? (
                <p className="mt-3 text-sm text-[var(--text-muted)]">No students match the current search.</p>
              ) : null}
            </div>

            <Button type="button" onClick={onSaveAssignments} disabled={savingAssignments || !selectedCourseId}>
              {savingAssignments ? 'Saving...' : 'Save Assignment'}
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
