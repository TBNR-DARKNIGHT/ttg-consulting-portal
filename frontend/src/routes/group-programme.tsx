import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/group-programme')({
  beforeLoad: () => {
    throw redirect({ to: '/consult', replace: true });
  },
});
