import AppHeader from '@/components/AppHeader';
import ProfileEditor from '@/components/ProfileEditor';

export default function ProfilePage() {
  return (
    <div className="h-screen flex flex-col">
      <AppHeader activeView="profile" />
      <main className="flex-1 overflow-hidden">
        <ProfileEditor />
      </main>
    </div>
  );
}
