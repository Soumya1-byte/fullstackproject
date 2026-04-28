import { useEffect, useMemo, useState } from 'react';
import { Filter, Layers3, Sparkles } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import SectionCard from '../../components/ui/SectionCard';
import EmptyState from '../../components/ui/EmptyState';
import SatisfactionPieChart from '../../components/charts/SatisfactionPieChart';
import RatingBarChart from '../../components/charts/RatingBarChart';
import TrendLineChart from '../../components/charts/TrendLineChart';
import { analyticsService } from '../../services/analyticsService';
import { courseService } from '../../services/courseService';

export default function AnalyticsPage() {
  const { dashboardSearchQuery = '' } = useOutletContext() || {};
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [activeBucket, setActiveBucket] = useState('');
  const [data, setData] = useState({
    satisfaction: [],
    distribution: [],
    trends: []
  });

  useEffect(() => {
    courseService
      .list()
      .then((courses) => {
        const list = courses || [];
        setCourses(list);
        setSemesters([...new Set(list.map((course) => course.semester).filter(Boolean))]);
        setDepartments([...new Set(list.map((course) => course.department).filter(Boolean))]);
      })
      .catch(() => {
        setCourses([]);
        setSemesters([]);
        setDepartments([]);
      });
  }, []);

  useEffect(() => {
    analyticsService.overview({ courseId, semester }).then((payload) => setData(payload || {}));
  }, [courseId, semester]);

  const normalizedQuery = dashboardSearchQuery.trim().toLowerCase();

  const filteredCourses = useMemo(() => {
    if (!normalizedQuery) return courses;
    return courses.filter((course) =>
      [course.code, course.title, course.semester, course.department].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
    );
  }, [courses, normalizedQuery]);

  useEffect(() => {
    if (courseId && !filteredCourses.some((course) => course._id === courseId)) {
      setCourseId('');
    }
  }, [courseId, filteredCourses]);

  const drillDown = useMemo(() => {
    if (!activeBucket) return [];
    return filteredCourses.filter((course) => {
      if (semester && course.semester !== semester) return false;
      if (department && course.department !== department) return false;
      return true;
    });
  }, [activeBucket, filteredCourses, semester, department]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Analytics Explorer</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">Deep-Dive Course Analytics</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">Filter, compare, and drill into rating behavior across semester cohorts.</p>
      </header>

      <SectionCard title="Filter Stack" subtitle="Apply strategic filters for comparative analysis">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">All Courses</option>
            {filteredCourses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.title}
              </option>
            ))}
          </Select>
          <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">All Semesters</option>
            {semesters.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              setCourseId('');
              setSemester('');
              setDepartment('');
              setActiveBucket('');
            }}
          >
            <Filter className="h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </SectionCard>

      {data.suppressed ? (
        <EmptyState
          icon={Sparkles}
          title="Analytics locked by privacy threshold"
          description="Collect at least 5 responses to unlock chart-level reporting."
        />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <SatisfactionPieChart data={data.satisfaction || []} />
            <RatingBarChart data={data.distribution || []} activeBucket={activeBucket} onBucketSelect={setActiveBucket} />
            <TrendLineChart data={data.trends || []} />
          </div>

          <SectionCard title="Drill-Down Analytics" subtitle="Click a rating bar to open detailed context">
            {!activeBucket ? (
              <p className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Layers3 className="h-4 w-4" />
                Select a bar from the rating distribution chart to reveal matching courses.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Selected rating bucket: {activeBucket}</p>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {drillDown.map((course) => (
                    <div key={course._id} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{course.code}</p>
                      <p className="text-xs text-[var(--text-muted)]">{course.title}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{course.department}</p>
                    </div>
                  ))}
                </div>
                {!drillDown.length ? <p className="text-sm text-[var(--text-muted)]">No matching courses for selected filters.</p> : null}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
