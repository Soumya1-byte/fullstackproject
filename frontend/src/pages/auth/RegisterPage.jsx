import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../hooks/useToast';

export default function RegisterPage() {
  const { register, handleSubmit } = useForm({ defaultValues: { role: 'STUDENT' } });
  const { register: registerUser, loading } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      const data = await registerUser(values);
      pushToast('Registration successful', 'success');
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/student');
    } catch (error) {
      const apiError = error.response?.data?.error;
      const details = apiError?.details?.fieldErrors;
      const firstFieldError = details ? Object.values(details).flat().find(Boolean) : null;
      const message =
        firstFieldError ||
        apiError?.message ||
        (error.request ? 'Cannot reach server. Check backend is running and API URL is correct.' : 'Registration failed');
      pushToast(message, 'error');
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Create account</h1>
      <p className="mb-5 text-sm text-[var(--color-text-secondary)]">Start collecting better feedback</p>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <Input placeholder="Name" {...register('name')} />
        <Input placeholder="Email" {...register('email')} />
        <Input placeholder="Password" type="password" {...register('password')} />
        <Select {...register('role')}>
          <option value="STUDENT">Student</option>
          <option value="ADMIN">Admin</option>
        </Select>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
