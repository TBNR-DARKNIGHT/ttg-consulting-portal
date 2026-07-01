# Incident Response Runbook

## TTG Consulting Portal - Operational Procedures

**Last Updated**: 2026-03-28
**Status**: 🚧 Planning

---

## Overview

This runbook provides procedures for responding to and resolving incidents in the TTG Consulting Portal.

**On-Call**: TBD

**Escalation**: TBD

---

## Incident Severity Levels

### SEV1 - Critical

**Definition**: Complete service outage or critical functionality broken

**Response Time**: Immediate (< 15 minutes)

**Examples**:
- Application completely down
- Database unreachable
- Data breach or security incident
- Payment processing failure

**Actions**:
1. Page on-call engineer immediately
2. Create incident channel
3. Notify stakeholders
4. Begin investigation

---

### SEV2 - High

**Definition**: Major functionality degraded but service partially available

**Response Time**: < 1 hour

**Examples**:
- Significant performance degradation
- Non-critical feature broken
- Intermittent errors affecting multiple users

**Actions**:
1. Notify on-call engineer
2. Create incident ticket
3. Begin investigation
4. Update status page

---

### SEV3 - Medium

**Definition**: Minor functionality issue affecting small subset of users

**Response Time**: < 4 hours (during business hours)

**Examples**:
- UI bug
- Non-critical API errors
- Minor performance issues

**Actions**:
1. Create ticket
2. Assign to appropriate team
3. Fix in next deployment

---

### SEV4 - Low

**Definition**: Cosmetic issues or minor inconveniences

**Response Time**: Next sprint

**Examples**:
- Typos
- Minor UI inconsistencies
- Feature requests

**Actions**:
1. Add to backlog
2. Prioritize with other work

---

## Incident Response Process

### 1. Detection

**Monitoring Alerts**: Automated alerts via TBD

**User Reports**: TBD (support email, chat, etc.)

### 2. Triage

**Steps**:
1. Confirm the issue
2. Determine severity
3. Assign incident commander
4. Create incident channel/ticket

### 3. Investigation

**Checklist**:
- [ ] Check monitoring dashboards
- [ ] Review error logs
- [ ] Check recent deployments
- [ ] Review database performance
- [ ] Check external service status

### 4. Communication

**Internal**:
- Update incident channel regularly
- Keep stakeholders informed

**External**:
- Update status page
- Notify affected users (if needed)

### 5. Resolution

**Steps**:
1. Identify root cause
2. Implement fix or workaround
3. Test fix thoroughly
4. Deploy fix
5. Verify resolution

### 6. Post-Incident

**Required**:
- Write incident report
- Conduct blameless postmortem
- Create action items to prevent recurrence
- Update runbooks

---

## Common Incidents & Solutions

### Application Down

**Symptoms**: Application not responding, 5xx errors

**Diagnosis**:
```bash
# Check application status
# TBD

# Check logs
# TBD

# Check resource usage
# TBD
```

**Common Causes**:
- Deployment issue
- Resource exhaustion (CPU, memory)
- Database connection issues

**Resolution**:
1. Check deployment status
2. Rollback if recent deployment
3. Restart application if needed
4. Scale resources if needed

---

### Database Issues

**Symptoms**: Slow queries, connection errors, timeouts

**Diagnosis**:
```bash
# Check database connections
# TBD

# Check slow queries
# TBD

# Check database size
# TBD
```

**Common Causes**:
- Too many connections
- Slow queries
- Disk space full
- Locks/deadlocks

**Resolution**:
1. Kill long-running queries
2. Add indexes if needed
3. Increase connection pool
4. Scale database resources

---

### Performance Degradation

**Symptoms**: Slow page loads, high response times

**Diagnosis**:
- Check monitoring dashboards
- Review APM traces
- Check database query performance
- Check external API response times

**Common Causes**:
- N+1 queries
- Missing indexes
- Large payloads
- External service slowdown

**Resolution**:
1. Optimize slow queries
2. Add caching
3. Implement pagination
4. Scale infrastructure

---

### Authentication Issues

**Symptoms**: Users unable to log in, 401 errors on protected endpoints, or `503 User profile unavailable`

**Diagnosis**:
- Check application logs for `"Failed to fetch JWKS"` (JWKS endpoint unreachable)
- Check for `"Unexpected error during authentication"` (catch-all triggered — investigate root cause)
- Check for `"Token missing required 'sub' claim"` in 401 responses (Clerk JWT template may need `sub`)
- Verify `CLERK_JWKS_URL` and `CLERK_ISSUER` environment variables are set and correct
- For user-sync `503` responses, verify `CLERK_SECRET_KEY`, Supabase service-role credentials, and
  the unique `users.clerk_user_id` mapping
- Verify Clerk dashboard status (https://status.clerk.com)

**Common Causes**:
- `CLERK_JWKS_URL` or `CLERK_ISSUER` misconfigured or unset
- Clerk JWKS endpoint down or unreachable (10s timeout will fire)
- JWKS cache expired and refresh failed — all new requests fail until Clerk recovers
- `CLERK_AUDIENCE` mismatch in staging/production (token's `aud` doesn't match configured value)
- Clerk JWT template missing `sub` claim (custom templates override defaults)
- Missing/wrong `CLERK_SECRET_KEY` when a new user's session token omits email/profile claims
- Supabase unavailable or a conflicting email/Clerk subject prevents local user synchronization

**Resolution**:
1. Verify `CLERK_JWKS_URL`, `CLERK_ISSUER`, `CLERK_AUDIENCE`, and backend-only `CLERK_SECRET_KEY`
2. Check Clerk service status
3. If JWKS fetch is timing out, check network connectivity from the backend host to Clerk
4. If `CLERK_AUDIENCE` was recently changed, redeploy with the updated value
5. Application restart clears the JWKS cache, forcing a fresh fetch

---

### External Service Outage

**Symptoms**: Features dependent on external APIs failing

**Diagnosis**:
- Check external service status pages
- Review API error logs

**Resolution**:
1. Implement graceful degradation
2. Show user-friendly error messages
3. Retry with exponential backoff
4. Monitor for service recovery

---

## Rollback Procedures

### Application Rollback

```bash
# Rollback to previous version
# TBD
```

**Steps**:
1. Identify last known good version
2. Trigger rollback deployment
3. Verify application health
4. Monitor for issues

### Database Rollback

**WARNING**: Database rollbacks can cause data loss

**Steps**:
1. Stop application writes
2. Run rollback migration
3. Verify data integrity
4. Restart application

---

## Emergency Contacts

**On-Call Engineer**: TBD

**Technical Lead**: TBD

**Product Owner**: TBD

**Hosting Provider Support**: TBD

---

## Communication Templates

### Status Page Update

```
[Investigating] We are currently investigating reports of [issue].
Updates will be provided as we learn more.

[Update] We have identified the issue as [cause].
Our team is working on a fix. ETA: [time].

[Resolved] The issue has been resolved.
All services are operating normally.
```

### User Notification Email

```
Subject: Service Disruption - [Date]

Dear valued customer,

We experienced a service disruption today between [time] and [time]
that affected [functionality].

The issue has been resolved and all services are operating normally.

We apologize for any inconvenience caused.

If you continue to experience issues, please contact support.

Thank you for your patience.
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

- Response time (p50, p95, p99)
- Error rate
- Request rate
- CPU/Memory usage
- Database connection pool
- External API response times

### Alert Configuration

**Tool**: TBD

**Alerts**:
- Error rate > X% → Page on-call
- Response time > X ms → Send alert
- Database connections > X% → Send alert
- Disk space > X% → Send alert

---

## Paid Mux Asset Is Publicly Playable

Treat an unauthenticated `200` response for a full paid video manifest as a content-access
incident.

### Confirm

1. Find every paid video in Supabase `resources`.
2. Confirm `mux_playback_signed = true` and record its Mux asset/playback IDs.
3. Request `https://stream.mux.com/<playback-id>.m3u8` without a token.
4. Inspect the Mux asset's complete Playback IDs list; a signed ID does not neutralize a separate
   public ID on the same asset.

### Contain and recover

1. Add a signed playback ID in Mux if the asset does not already have one.
2. Update/synchronize the Supabase resource to reference the signed ID.
3. Verify entitled playback through `/api/v1/playback/mux-token`.
4. Delete all public playback IDs from the paid asset.
5. Probe the deleted IDs until none returns `200`.
6. Review Mux delivery/data logs to estimate exposure and rotate playback IDs if warranted.

Do not delete the only working public ID before the application references and successfully tests
the signed ID unless immediate containment is more important than playback availability.

---

## Post-Incident Review

### Incident Report Template

```markdown
# Incident Report: [Title]

**Date**: YYYY-MM-DD
**Severity**: SEV1/SEV2/SEV3/SEV4
**Duration**: [X hours/minutes]
**Affected Users**: [Number/percentage]

## Summary
[Brief description of what happened]

## Timeline
- HH:MM - Incident detected
- HH:MM - Investigation began
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

## Root Cause
[Technical explanation of what went wrong]

## Resolution
[What was done to fix the issue]

## Impact
- Users affected: [number]
- Revenue impact: [if applicable]
- Data loss: [if any]

## Action Items
- [ ] [Action to prevent recurrence]
- [ ] [Documentation update]
- [ ] [Monitoring improvement]

## Lessons Learned
[What we learned and how we'll improve]
```

---

## Related Documentation

- [Deployment Guide](../deployment/environments.md)
- [Architecture Overview](../architecture/overview.md)

---

**Next Steps**:
1. Set up monitoring and alerts
2. Configure on-call rotation
3. Create runbooks for specific scenarios
4. Test incident response procedures
5. Conduct tabletop exercises

---

<!-- Update this runbook after every incident -->
