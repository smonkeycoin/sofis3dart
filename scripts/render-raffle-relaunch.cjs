// Preview only: this script has no mail-provider client and cannot send email.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const React=require('react');
const {render}=require('@react-email/render');
const load=require('./load-source.cjs');
const {PrizeRelaunch,buildRelaunchText,relaunchSubject,relaunchPreheader}=load('emails/PrizeRelaunch.tsx');
async function main(){
  const evidence=path.resolve(process.argv[2]);
  const manifest=JSON.parse(fs.readFileSync(path.join(evidence,'campaign_manifest_private.json'),'utf8'));
  if(manifest.approved!==false||manifest.sent!==0)throw Error('Only an unsent draft can be rendered');
  const out=path.join(evidence,'email-previews');fs.mkdirSync(out,{recursive:true,mode:0o700});
  const seen=new Set();
  for(const recipient of manifest.recipients){
    if(seen.has(recipient.recipient))throw Error('Duplicate recipient');seen.add(recipient.recipient);
    const key=crypto.createHash('sha256').update(recipient.recipient).digest('hex');
    const html=await render(React.createElement(PrizeRelaunch,{ticketNumbers:recipient.ticket_numbers}));
    fs.writeFileSync(path.join(out,key+'.html'),html,{mode:0o600});
    fs.writeFileSync(path.join(out,key+'.txt'),buildRelaunchText(recipient.ticket_numbers),{mode:0o600});
    recipient.preview_html_sha256=crypto.createHash('sha256').update(html).digest('hex');
    recipient.preview_file=`email-previews/${key}.html`;
  }
  fs.writeFileSync(path.join(evidence,'campaign_manifest_private.json'),JSON.stringify(manifest,null,2)+'\n',{mode:0o600});
  const sample=manifest.recipients.find(r=>r.ticket_numbers.includes('01')&&r.ticket_numbers.includes('26'));
  if(!sample)throw Error('Verified sample recipient missing');
  fs.copyFileSync(path.join(evidence,sample.preview_file),path.join(evidence,'email-preview.html'));
  console.log(JSON.stringify({campaign_id:manifest.campaign_id,recipients:seen.size,subject:relaunchSubject,preheader:relaunchPreheader,sent:0,preview:'email-preview.html'}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
