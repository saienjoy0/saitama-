// Research-only function probes; no DOM, customer data, provider API or product changes.
// Usage: node this-file.mjs PINNED_PR14_HTML FIXTURES_JSON OUTPUT_JSON
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const [sourcePath, fixturePath, outputPath] = process.argv.slice(2);
if (!sourcePath || !fixturePath || !outputPath) throw new Error('Need source, fixtures, output');
const html = fs.readFileSync(sourcePath, 'utf8');
const sourceHash = crypto.createHash('sha256').update(html).digest('hex');
if (sourceHash !== '0e35b849b7f680826850b2134158c49c644fb710070069437e8ad58aef94bfba') throw new Error('Not the pinned PR14 source');
const fixtures = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const between = (start, end) => {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  if (a < 0 || b <= a || html.indexOf(start, a + 1) >= 0) throw new Error('Source seam changed');
  return html.slice(a, b);
};
// All response/state functions below are verbatim source slices. No response is mocked.
const code = [
  between('const esc=', 'const yen='),
  between('const yen=', 'const scenes='),
  between('function newState()', '// 発表用の架空の過去記録。'),
  between('function normalize(t)', 'function extract(t,f)'),
  between('const E=(text)', '// 公開用の説明根拠。'),
  between('const otherExamples=', 'function bubble(turn,')
].join('\n');
const context = vm.createContext({});
vm.runInContext(code + '\nlet scene="family";', context);
const probes = fixtures.cases.map(c => {
  context.input = c.probe.input;
  context.initialPhase = c.probe.initial_phase;
  const r = vm.runInContext('(()=>{ const st=newState(); st.phase=initialPhase; const result=simpleOther(input,st); return {state:st,result}; })()', context);
  return {case_id:c.id, execution_type:'EXECUTED_FUNCTION_TEST', ...r,
    expected_behavior:c.expected_behavior,
    expectation_assessment:'MANUAL_COMPARE_WITH_CARD',
    scope:'simpleOther only; initial state is synthetic. send/appendTurn/DOM/permissions/whole flow not executed.'};
});
const result = {
  date:'2026-10-10', source_type:'SYNTHETIC_DESIGN_TEST', not_a_forecast:true,
  observed_households:0, observed_payments:0,
  source_repository:'saienjoy0/saitama-', source_pr:14,
  source_commit:'2a850fc3ab71b987a17655d517397993e830419e',
  source_path:'docs/review/family-ui-handoff-20261008/index.html',
  source_sha256:crypto.createHash('sha256').update(html).digest('hex'),
  extracted_source_sha256:crypto.createHash('sha256').update(code).digest('hex'),
  runtime:process.version, probes,
  browser:{status:'BLOCKED_ENVIRONMENT', executed_ui_tests:0,
    reason:'Playwright chromium.launch failed: executable missing at /root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell'},
  paper:{status:'SPEC_WALKTHROUGH', executed_household_tests:0},
  general_ai:{status:'NOT_EXECUTED', provider_api_calls:0},
  competitors:{status:'SPEC_WALKTHROUGH', executed_app_tests:0},
  warning:'No child response, completion time, preference, repeat use or purchase is inferred from these functions.'
};
fs.writeFileSync(outputPath, JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({source_sha256:result.source_sha256, probes:probes.map(p=>({id:p.case_id,phase:p.state.phase,done:p.state.done,say:p.result.say,title:p.result.title})),browser:result.browser}));
