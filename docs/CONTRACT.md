# The contract Auth builds against

Auth and Account are specified by one reconciled document:

**[`docs/account-auth-canonical-contract.md`](https://github.com/HarithKavish/account/blob/main/docs/account-auth-canonical-contract.md)**
in the Account repository — Canonical **v1.5**.

It is not copied here. One authoritative source, referenced rather than
duplicated, is how the ecosystem avoids two contracts that slowly disagree —
which is the failure this file exists to record, not repeat.

## What it settles for Auth

| | |
| --- | --- |
| Invariants | V1–V28. Binding; changing one is an architecture change |
| Private interface | §5.2–§5.10, the operations Auth calls on Account |
| Lifetimes | §2 — 5-minute access tokens, 30-day absolute refresh that rotation does not extend |
| Revocation | §4 — pull-based, derived from `account_events`, no Account→Auth channel |
| Service authentication | §3 — asymmetric signed assertions, `private_key_jwt`, no shared secret |
| Ceremonies | §7 — WebAuthn, recovery, and federated sign-in |
| Failure behaviour | §11 — 15-minute bounded grace, security state only |

## This service is folding into Account

Under **§0.5**, Account and Auth are **one deployable at one origin**,
`account.harithkavish.com`. The ownership boundary between them is retained, in
code rather than across a network.

Everything this repository was going to be responsible for still exists — the
authorization server, the ceremonies, the token lifetimes. It runs in the same
process as the half that owns the user, so there is no service assertion to sign
and no outage to survive between them.

**The WebAuthn RP ID moved to `account.harithkavish.com`** while no passkey
existed. V11 called that irreversible, and it is — from the first registered
passkey, which is why the decision had to be taken before one was.

`auth.harithkavish.com` stays as an alias. Nothing pointing at it breaks, and
splitting the halves apart later remains a refactor rather than a rewrite.

**§15 lists what folding removes**: §3 service authentication, §11.1 outage
grace, the replay cache, the topology question, most of the timeout budget —
four open questions closed and one reduced.

## Status

**Nothing in it is authorized for implementation** (§13). This site performs no
authentication, and that is deliberate — see the README.

## Two records worth keeping

**U6 is unblocked.** Auth's largest blocker was that Account's interface
specification "exists but is uncommitted and unreachable from this repository".
All three of Account's documents are on its `main` now. The canonical contract's
§0.1 still describes the old state and is stale on this point.

**Auth's own contract documents are not committed.** The canonical contract
reconciles `auth-implementation-contract.md` and `account-integration-review.md`
and cites them throughout — U-numbers, AR-numbers, its §25 and §5.8. Neither is
in this repository, so **the reasoning behind Auth's half of the reconciliation
cannot be read by anyone, including Account.**

That is the same defect Account had, pointing the other way, and it has the same
cost: the canonical document survives, the arguments that produced it do not. The
fix is to commit them, not to reconstruct them from the reconciliation.
