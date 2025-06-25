
'use client';

import { AppHeader } from '@/components/layout/app-header';
import PeopleManager from '@/components/people/people-manager';

export default function PeoplePage() {
  return (
    <>
      <AppHeader title="Manage People" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PeopleManager />
      </div>
    </>
  );
}
