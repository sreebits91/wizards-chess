(() => {
const PIECES={P:"♟",N:"♞",B:"♝",R:"♜",Q:"♛",K:"♚",p:"♟",n:"♞",b:"♝",r:"♜",q:"♛",k:"♚"};
const files="abcdefgh", start=()=>[
["r","n","b","q","k","b","n","r"],Array(8).fill("p"),
...Array.from({length:4},()=>Array(8).fill(null)),Array(8).fill("P"),
["R","N","B","Q","K","B","N","R"]];
let board=start(),turn="w",selected=null,history=[],enPassant=null,castling={K:true,Q:true,k:true,q:true},gameOver=false,voice=null;
const $=id=>document.getElementById(id), boardEl=$("board"), clone=b=>b.map(r=>r.slice()), color=p=>p&&(p===p.toUpperCase()?"w":"b"), opp=c=>c==="w"?"b":"w";
const sqName=(r,c)=>files[c]+(8-r), inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;

function draw(){
 boardEl.innerHTML="";
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const s=document.createElement("div");s.className="sq "+((r+c)%2?"dark":"light");s.dataset.r=r;s.dataset.c=c;s.onclick=()=>clickSquare(r,c);
  if(selected&&selected[0]===r&&selected[1]===c)s.classList.add("selected");
  const p=board[r][c];
  if(p){const x=document.createElement("span");x.className="piece "+(color(p)==="w"?"white-piece":"black-piece");x.textContent=PIECES[p];s.appendChild(x)}
  if(c===0){const z=document.createElement("span");z.className="coord rank";z.textContent=8-r;s.appendChild(z)}
  if(r===7){const z=document.createElement("span");z.className="coord file";z.textContent=files[c];s.appendChild(z)}
  if(selected&&legalMoves(selected[0],selected[1]).some(m=>m.r===r&&m.c===c)){s.classList.add("target");if(board[r][c]||isEP(selected[0],selected[1],r,c))s.classList.add("capture")}
  boardEl.appendChild(s);
 }
 $("turnBadge").textContent=(turn==="w"?"White":"Black")+" to move";renderMoves();
}
function attacks(b,r,c,tr,tc){
 const p=b[r][c],pc=p&&p.toUpperCase();if(!p)return false;const dr=tr-r,dc=tc-c;
 if(pc==="P")return color(p)==="w"?dr===-1&&Math.abs(dc)===1:dr===1&&Math.abs(dc)===1;
 if(pc==="N")return [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].some(x=>x[0]===dr&&x[1]===dc);
 if(pc==="K")return Math.max(Math.abs(dr),Math.abs(dc))===1;
 const diag=Math.abs(dr)===Math.abs(dc),straight=dr===0||dc===0;
 if((pc==="B"&&!diag)||(pc==="R"&&!straight)||(pc==="Q"&&!diag&&!straight))return false;
 const sr=Math.sign(dr),sc=Math.sign(dc);let rr=r+sr,cc=c+sc;
 while(rr!==tr||cc!==tc){if(b[rr][cc])return false;rr+=sr;cc+=sc}return true;
}
function inCheck(b,side){
 let kr=-1,kc=-1;
 for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(b[r][c]===(side==="w"?"K":"k")){kr=r;kc=c}
 if(kr<0)return true;
 for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(color(b[r][c])===opp(side)&&attacks(b,r,c,kr,kc))return true;
 return false;
}
function pseudo(r,c,includeCastle=true){
 const p=board[r][c],pc=p&&p.toUpperCase(),side=color(p),out=[];if(!p||side!==turn)return out;
 const add=(rr,cc,extra={})=>{if(inside(rr,cc)&&color(board[rr][cc])!==side)out.push(Object.assign({r:rr,c:cc},extra))};
 if(pc==="P"){
  const d=side==="w"?-1:1,home=side==="w"?6:1;
  if(inside(r+d,c)&&!board[r+d][c]){add(r+d,c,{promo:r+d===0||r+d===7});if(r===home&&!board[r+2*d][c])add(r+2*d,c)}
  for(const dc of[-1,1]){const rr=r+d,cc=c+dc;if(!inside(rr,cc))continue;if(board[rr][cc]&&color(board[rr][cc])!==side)add(rr,cc,{promo:rr===0||rr===7});else if(enPassant&&enPassant.r===rr&&enPassant.c===cc)add(rr,cc,{ep:true})}
 }else if(pc==="N"){
  for(const x of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])add(r+x[0],c+x[1]);
 }else if("BRQ".includes(pc)){
  const dirs=pc==="B"?[[-1,-1],[-1,1],[1,-1],[1,1]]:pc==="R"?[[-1,0],[1,0],[0,-1],[0,1]]:[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
  for(const d of dirs){let rr=r+d[0],cc=c+d[1];while(inside(rr,cc)){if(!board[rr][cc])out.push({r:rr,c:cc});else{add(rr,cc);break}rr+=d[0];cc+=d[1]}}
 }else if(pc==="K"){
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)add(r+dr,c+dc);
  if(includeCastle&&!inCheck(board,side)){const row=side==="w"?7:0,k=side==="w"?"K":"k",q=side==="w"?"Q":"q";
   if(c===4&&castling[k]&&!board[row][5]&&!board[row][6]&&!attacks(board,row,5,row,4)&&!attacks(board,row,6,row,4))out.push({r:row,c:6,castle:"K"});
   if(c===4&&castling[q]&&!board[row][1]&&!board[row][2]&&!board[row][3]&&!attacks(board,row,3,row,4)&&!attacks(board,row,2,row,4))out.push({r:row,c:2,castle:"Q"});
  }
 }return out;
}
function applyMove(m,record=true){
 const b=clone(board),p=b[m.fr][m.fc],side=color(p);let captured=b[m.r][m.c];b[m.fr][m.fc]=null;
 if(m.ep){captured=b[m.r+(side==="w"?1:-1)][m.c];b[m.r+(side==="w"?1:-1)][m.c]=null}
 b[m.r][m.c]=m.promo?(side==="w"?"Q":"q"):p;
 if(m.castle){const row=m.r;if(m.c===6){b[row][5]=b[row][7];b[row][7]=null}else{b[row][3]=b[row][0];b[row][0]=null}}
 const ep=(p&&p.toUpperCase()==="P"&&Math.abs(m.r-m.fr)===2)?{r:(m.r+m.fr)/2,c:m.fc}:null;
 const old={board,turn,enPassant,castling:Object.assign({},castling),captured,move:m};
 board=b;turn=opp(turn);enPassant=ep;
 if(p==="K"){castling.K=false;castling.Q=false}if(p==="k"){castling.k=false;castling.q=false}
 if(p==="R"&&m.fr===7&&m.fc===0)castling.Q=false;if(p==="R"&&m.fr===7&&m.fc===7)castling.K=false;
 if(p==="r"&&m.fr===0&&m.fc===0)castling.q=false;if(p==="r"&&m.fr===0&&m.fc===7)castling.k=false;
 if(m.r===7&&m.c===0)castling.Q=false;if(m.r===7&&m.c===7)castling.K=false;if(m.r===0&&m.c===0)castling.q=false;if(m.r===0&&m.c===7)castling.k=false;
 if(record)history.push(old);return old;
}
function restore(old){board=old.board;turn=old.turn;enPassant=old.enPassant;castling=old.castling}
function undo(){
 if(!history.length)return false;const h=history.pop();restore(h);gameOver=false;selected=null;draw();$("status").textContent="Move undone.";return true;
}
function legalMoves(r,c){
 const p=board[r][c];if(!p||color(p)!==turn)return[];
 return pseudo(r,c).filter(m=>{const old=applyMove(Object.assign({fr:r,fc:c},m),false);const ok=!inCheck(board,opp(turn));restore(old);return ok});
}
function allMoves(side=turn){
 const saved=turn;turn=side;const out=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(color(board[r][c])===side)for(const m of legalMoves(r,c))out.push(Object.assign({fr:r,fc:c},m));turn=saved;return out;
}
function isEP(fr,fc,r,c){return enPassant&&enPassant.r===r&&enPassant.c===c&&board[fr][fc]&&board[fr][fc].toUpperCase()==="P"}
function notation(m,p){return (p&&p.toUpperCase()==="P"?"":p.toUpperCase())+sqName(m.fr,m.fc)+"–"+sqName(m.r,m.c)+(m.promo?"=Q":"")+(m.castle?" "+(m.c===6?"O-O":"O-O-O"):"")}
function finishCheck(){
 const moves=allMoves(turn);
 if(!moves.length){gameOver=true;$("status").textContent=inCheck(board,turn)?"Checkmate — "+(turn==="w"?"Black":"White")+" wins.":"Stalemate — draw."}
 else if(inCheck(board,turn))$("status").textContent="Check!";
 else $("status").textContent=turn==="w"?"Your move.":"The wizard is thinking…";
}
function make(m){
 if(gameOver)return;const text=notation(m,board[m.fr][m.fc]);applyMove(m,true);selected=null;$("heard").textContent=text;draw();finishCheck();
 if(!gameOver&&$("mode").value==="ai"&&turn==="b")setTimeout(aiMove,180);
}
function clickSquare(r,c){
 if(gameOver||($("mode").value==="ai"&&turn==="b"))return;const p=board[r][c];
 if(selected){const m=legalMoves(selected[0],selected[1]).find(x=>x.r===r&&x.c===c);if(m){make(Object.assign({fr:selected[0],fc:selected[1]},m));return}selected=null}
 if(p&&color(p)===turn)selected=[r,c];draw();
}
function renderMoves(){
 const ol=$("moveList");ol.innerHTML="";
 history.forEach((h,i)=>{const li=document.createElement("li");li.textContent=notation(h.move,h.board[h.move.fr][h.move.fc]);if(i===history.length-1)li.className="latest";ol.appendChild(li)});
}
const values={P:100,N:320,B:330,R:500,Q:900,K:20000};
function evaluate(){let s=0;for(const row of board)for(const p of row)if(p)s+=(color(p)==="w"?1:-1)*values[p.toUpperCase()];return s}
function minimax(depth,alpha,beta,maximizing){
 const moves=allMoves(turn);
 if(!depth||!moves.length)return evaluate()+(inCheck(board,turn)?(turn==="b"?-100000:100000):0);
 let best=maximizing?-Infinity:Infinity;
 for(const m of moves){const old=applyMove(m,false);const v=minimax(depth-1,alpha,beta,!maximizing);restore(old);
  if(maximizing){best=Math.max(best,v);alpha=Math.max(alpha,v)}else{best=Math.min(best,v);beta=Math.min(beta,v)}if(beta<=alpha)break}
 return best;
}
function aiMove(){
 if(gameOver||turn!=="b")return;const depth=$("difficulty").value==="easy"?1:$("difficulty").value==="medium"?2:3,moves=allMoves("b");if(!moves.length)return;
 let best=moves[0],bestV=Infinity;
 for(const m of moves){const old=applyMove(m,false),v=minimax(depth-1,-Infinity,Infinity,true);restore(old);if(v<bestV){bestV=v;best=m}}
 make(best);
}
function parseVoice(t){
 t=t.toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
 const nums={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8};for(const k in nums)t=t.replaceAll(k,String(nums[k]));
 const map={a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7};let from,to,match=t.match(/([a-h])\s*([1-8]).*?([a-h])\s*([1-8])/);
 if(match)from=[8-Number(match[2]),map[match[1]]],to=[8-Number(match[4]),map[match[3]]];
 else{const pc={pawn:"P",knight:"N",bishop:"B",rook:"R",queen:"Q",king:"K"},piece=Object.keys(pc).find(k=>t.includes(k)),dest=t.match(/([a-h])\s*([1-8])/);
  if(piece&&dest){to=[8-Number(dest[2]),map[dest[1]]];const candidates=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===pc[piece]&&legalMoves(r,c).some(m=>m.r===to[0]&&m.c===to[1]))candidates.push([r,c]);if(candidates.length===1)from=candidates[0]}
 }
 if(!from||!to)return false;const m=legalMoves(from[0],from[1]).find(x=>x.r===to[0]&&x.c===to[1]);if(m){make(Object.assign({fr:from[0],fc:from[1]},m));return true}return false;
}
function setupVoice(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){$("support").textContent="Speech recognition is not available in this browser. Use the board controls.";$("voiceBtn").disabled=true;return}
 voice=new SR();voice.lang="en-GB";voice.interimResults=false;voice.continuous=false;
 voice.onstart=()=>{$("voiceStatus").textContent="Listening…";$("voiceBtn").textContent="🎙 Listening"};
 voice.onend=()=>{$("voiceStatus").textContent="Voice idle";$("voiceBtn").textContent="🎙 Listen"};
 voice.onerror=e=>$("voiceStatus").textContent="Voice error: "+e.error;
 voice.onresult=e=>{const t=e.results[0][0].transcript;$("heard").textContent="Heard: "+t;if(!parseVoice(t))$("status").textContent="I could not map that to a legal move."};
 $("voiceBtn").onclick=()=>voice.start();$("stopVoice").onclick=()=>voice&&voice.stop();
}
$("undoBtn").onclick=()=>{if(undo()&&$("mode").value==="ai")undo()};
$("resetBtn").onclick=()=>{board=start();turn="w";selected=null;history=[];enPassant=null;castling={K:true,Q:true,k:true,q:true};gameOver=false;$("status").textContent="New game. White to move.";draw()};
$("mode").onchange=()=>{$("status").textContent=$("mode").value==="human"?"Two-player mode.":"Play the Wizard — you are White."};
setupVoice();draw();
})();