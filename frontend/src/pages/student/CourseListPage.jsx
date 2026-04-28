import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { courseService } from '../../services/courseService';
import { useAuth } from '../../hooks/useAuth';

export default function CourseListPage() {
  const [courses, setCourses] = useState([]);
  const { bootstrapping, isAuthenticated } = useAuth();

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return undefined;

    let active = true;

    courseService
      .list()
      .then((data) => {
        if (active) {
          setCourses(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (active) {
          setCourses([]);
        }
      });

    return () => {
      active = false;
    };
  }, [bootstrapping, isAuthenticated]);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {!courses.length && (
        <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          No assigned courses yet. Courses will appear here when your institution assigns them.
        </div>
      )}
      {courses.map((course) => (
        <Card key={course._id} title={course.title} subtitle={`${course.code} • ${course.semester}`}>
          <p className="text-sm text-slate-500 dark:text-slate-300">{course.department}</p>
        </Card>
      ))}
    </div>
  );
}
