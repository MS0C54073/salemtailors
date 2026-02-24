import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

const Messages = () => {
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Messages</h1>
        <Card className="p-8 text-center">
          <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Messaging coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">Chat with your tailor directly</p>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
