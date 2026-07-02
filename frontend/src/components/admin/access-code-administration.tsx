import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, KeyRound, RefreshCw, ShieldX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { usePortalAuth } from '@/auth/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  createAdminAccessCode,
  getAdminAccessCodes,
  reissueAdminAccessCode,
  revokeAdminAccessCode,
  type AdminAccessCode,
  type IssuedAccessCode,
} from '@/lib/api';

function codeStatus(code: AdminAccessCode) {
  if (code.revokedAt) return 'Revoked';
  if (code.redeemedAt) return 'Redeemed';
  if (code.expiresAt && new Date(code.expiresAt) <= new Date()) return 'Expired';
  return 'Active';
}

export function AdminHomePage() {
  const { getToken } = usePortalAuth();
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [issued, setIssued] = useState<IssuedAccessCode | null>(null);
  const codes = useQuery({
    queryKey: ['admin-access-codes'],
    queryFn: () => getAdminAccessCodes(getToken),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-access-codes'] });

  const createCode = useMutation({
    mutationFn: () =>
      createAdminAccessCode(
        {
          courseId: 'course-2',
          ...(orderId.trim() ? { orderId: orderId.trim() } : {}),
          ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
        },
        getToken,
      ),
    onSuccess: (result) => {
      setIssued(result);
      setOrderId('');
      setExpiresAt('');
      void refresh();
      toast.success('Access code created');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Creation failed'),
  });

  const revokeCode = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      revokeAdminAccessCode(id, reason, getToken),
    onSuccess: () => {
      void refresh();
      toast.success('Access code revoked');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Revocation failed'),
  });

  const reissueCode = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      reissueAdminAccessCode(id, reason, getToken),
    onSuccess: (result) => {
      setIssued(result);
      void refresh();
      toast.success('Replacement code created');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Reissue failed'),
  });

  const askReason = (verb: 'revoke' | 'reissue', id: string) => {
    const reason = window.prompt(`Reason to ${verb} this code:`);
    if (!reason || reason.trim().length < 3) return;
    if (verb === 'revoke') revokeCode.mutate({ id, reason: reason.trim() });
    else reissueCode.mutate({ id, reason: reason.trim() });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setIssued(null);
    createCode.mutate();
  };

  return (
    <main className="mx-auto w-full max-w-[69rem] space-y-8 px-6 py-8 md:px-10 md:py-10">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Access Code Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create, revoke, and replace single-use Course 2 codes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Access Code</CardTitle>
            <CardDescription>The plaintext code is shown only once.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="order-id">Order ID</label>
                <Input id="order-id" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="expires-at">Expires at</label>
                <Input id="expires-at" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
              <Button className="w-full" disabled={createCode.isPending}>
                <KeyRound className="mr-2 size-4" />
                {createCode.isPending ? 'Creating…' : 'Create code'}
              </Button>
            </form>
            {issued && (
              <div className="mt-5 rounded-md border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Copy this code now
                </p>
                <p className="mt-2 break-all font-mono text-sm font-semibold">{issued.code}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    void navigator.clipboard.writeText(issued.code);
                    toast.success('Code copied');
                  }}
                >
                  <Copy className="mr-2 size-4" /> Copy
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Codes</CardTitle>
            <CardDescription>Up to 200 most recently created codes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {codes.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {codes.isError && <p className="text-sm text-destructive">Unable to load access codes.</p>}
            {codes.data?.map((code) => {
              const status = codeStatus(code);
              const actionable = status === 'Active';
              return (
                <div key={code.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{code.orderId || 'No order ID'}</span>
                        <Badge variant={status === 'Active' ? 'default' : 'secondary'}>{status}</Badge>
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{code.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created {new Date(code.createdAt).toLocaleString()}
                      </p>
                      {code.revocationReason && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Reason: {code.revocationReason}
                        </p>
                      )}
                    </div>
                    {actionable && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => askReason('reissue', code.id)}>
                          <RefreshCw className="mr-2 size-4" /> Reissue
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => askReason('revoke', code.id)}>
                          <ShieldX className="mr-2 size-4" /> Revoke
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {codes.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No access codes have been created.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
