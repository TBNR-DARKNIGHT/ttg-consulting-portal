import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function ConsultationRequestCard() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    toast.success('Request received', {
      description: "We'll get back to you shortly to confirm your consultation.",
    });
    setName('');
    setEmail('');
    setPreferredDate('');
    setMessage('');
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Book A 1-On-1 Consultation</CardTitle>
        <CardDescription>
          Share your details and a consultant will reach out to schedule a session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="consult-name">Name</Label>
              <Input
                id="consult-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consult-email">Email</Label>
              <Input
                id="consult-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="consult-date">Preferred date</Label>
            <Input
              id="consult-date"
              name="preferredDate"
              type="date"
              value={preferredDate}
              onChange={(ev) => setPreferredDate(ev.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consult-message">Message</Label>
            <Textarea
              id="consult-message"
              name="message"
              value={message}
              onChange={(ev) => setMessage(ev.target.value)}
              placeholder="Tell us about your goals or questions…"
              className="min-h-[120px] resize-y"
              required
            />
          </div>
          <Button type="submit" className="w-fit bg-primary font-semibold">
            Submit Request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
