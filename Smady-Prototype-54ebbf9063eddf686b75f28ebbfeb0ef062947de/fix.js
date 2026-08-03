const fs = require('fs');
const path = 'components/testing/AgentProgress.tsx';
let c = fs.readFileSync(path, 'utf8');

// The file uses CRLF line endings
const EOL = '\r\n';

const oldBlock = [
  '            <div',
  '              style={{',
  "                fontSize: 10,",
  "                color: '#858591',",
  "                fontFamily: \"'DM Mono', monospace\",",
  '                marginBottom: 6,',
  "                display: 'flex',",
  "                justifyContent: 'space-between',",
  '              }}',
  '            >',
  '',
  '              {(isRunning || isLoading) && (',
  "                <span style={{ color: '#755ac4' }}>● Recording</span>",
  '              )}',
  '            </div>',
  '',
  '          </div>',
  '      )}',
].join(EOL);

const newBlock = [
  '            <div',
  '              style={{',
  "                fontSize: 10,",
  "                color: '#858591',",
  "                fontFamily: \"'DM Mono', monospace\",",
  '                marginBottom: 6,',
  "                display: 'flex',",
  "                justifyContent: 'space-between',",
  '              }}',
  '            >',
  '              <span>LIVE LOGS</span>',
  '              {(isRunning || isLoading) && (',
  "                <span style={{ color: '#755ac4' }}>● Recording</span>",
  '              )}',
  '            </div>',
  '            <LiveLog logs={logs} />',
  '          </div>',
  '        </div>',
  '      )}',
].join(EOL);

if (c.includes(oldBlock)) {
  c = c.replace(oldBlock, newBlock);
  fs.writeFileSync(path, c, 'utf8');
  console.log('SUCCESS: Replaced broken JSX section');
} else {
  console.log('FAILED: Could not find the exact old block');
  // Debug: normalize line endings and try again
  const normalized = c.replace(/\r\n/g, '\n');
  const oldNormalized = oldBlock.replace(/\r\n/g, '\n');
  if (normalized.includes(oldNormalized)) {
    console.log('Found with normalized line endings, rewriting file with LF');
    const newNormalized = newBlock.replace(/\r\n/g, '\n');
    c = normalized.replace(oldNormalized, newNormalized);
    fs.writeFileSync(path, c, 'utf8');
    console.log('SUCCESS with LF normalization');
  } else {
    console.log('Still not found even with normalized endings');
    const idx = c.indexOf('Recording');
    console.log('Context around Recording:');
    console.log(JSON.stringify(c.substring(Math.max(0, idx - 300), idx + 200)));
  }
}
