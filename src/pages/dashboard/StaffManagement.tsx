import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

const StaffManagement = () => {
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Staff Management</h1>
        <Card className="p-8 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Staff management coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">Manage admin & sub-admin accounts</p>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffManagement;
