# Lean / Pretotyping Experiments — rerun with 今の進捗(1)

Applied upstream skill: `brainstorm-experiments-new`.

## Experiment 1 — Three-entry onboarding test
### Hypothesis
At least a meaningful share of first-time target children will complete the core noticing/proposal interaction and voluntarily ask for another attempt; one entry method will outperform the others without supplying the answer.

### Variants
A. AI apprentice / child teaches AI.
B. Simple observation mission card.
C. Parent provides only a household situation; facilitator asks minimal neutral questions.

### Measure
- completion;
- voluntary “again” behavior;
- number and strength of hints needed;
- whether proposed action originated from child.

### Kill signal
AI variant only works because it provides more direction than the non-AI variants.

## Experiment 2 — Scaffolding decay test
### Hypothesis
Across 3–5 real sessions, at least some children require fewer/less-direct hints in one or more dimensions and begin supplying observations without a concrete prompt.

### Method
Manual concierge. Record each session’s minimum hint level:
0 self-start
1 free response question
2 rephrased question
3 observation lens
4 options
5 one example

Track separately for noticing, articulation, solution, negotiation, reflection.

### Strong success signal
Same child moves toward lower hint numbers and later initiates a real household observation.

### Failure signal
App usage continues but required guidance remains constant or increases.

## Experiment 3 — Parent burden test
### Hypothesis
Parents can enable and close a session with sufficiently low effort that they willingly run a second session.

### Method
Parent input limited to:
- select/type one situation;
- agree boundaries/conditions if needed;
- one-tap value feedback after action.

### Measure
Actual time/taps, complaints, second-session behavior.

### Failure signal
Parent likes the concept but does not repeat because it requires coaching or writing.

## Experiment 4 — Autonomy reality test
### Hypothesis
Households can preserve safe boundaries while respecting a child’s real refusal/modification/negotiation.

### Method
During a real task opportunity, explicitly allow the child to decline, change timing/method, or negotiate compensation/help. Observe adult response.

### Failure signal
UI allows refusal but adult pressure makes refusal costly in practice.

## Experiment 5 — Concrete value feedback test
### Hypothesis
Lightweight but concrete family feedback makes the action-value connection clearer than generic “good job.”

### Variants
A. generic praise only.
B. select one concrete change: time saved / easier / happy / learned / other.

### Measure
Child can explain what changed and proposes an improvement/next action.

## Experiment 6 — Paid continuation
### Hypothesis
After multiple real sessions and observed value, some target parents will make a real financial commitment.

### Method
Offer a specific paid continuation/pilot. Do not ask only “how much would you pay?”

### Measure
Payment/deposit/paid continuation versus praise-only.

## Sequence
Run 1 + 2 + 3 first. Then 4 and 5. Only after experienced value, run 6.

Do not build the support-profile engine before Experiment 2 shows that support decay is observable and useful.
