import { build } from "esbuild";
import { deriveCompiledActionsFromFrontpage, type CompiledContractActionV1 } from "@/lib/contract-actions";
import type { FrontpageConfig } from "@/lib/frontpage-config";

export type CompiledFrontpageScript = {
  filename: "script.js";
  contentType: "application/javascript; charset=utf-8";
  scriptTag: '<script src="./script.js" defer></script>';
  script: string;
  actions: CompiledContractActionV1[];
};

function serialize(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function browserEntry(config: FrontpageConfig, actions: CompiledContractActionV1[], mountSelector: string): string {
  return `
import { prepareContractTransaction } from "./src/lib/execute-contract-action";

const CONFIG=${serialize({ hero: config.hero, chainId: config.chainId, actions, mountSelector })};
let account=null;
let provider=null;
let mountedContainer=null;
const listeners=new Map();
const emit=(name,detail={})=>{
  (listeners.get(name)||[]).forEach((handler)=>handler(detail));
  window.dispatchEvent(new CustomEvent("contractkit:"+name,{detail}));
};
const short=(value)=>value?value.slice(0,6)+"…"+value.slice(-4):"";
const hexChain=(value)=>"0x"+Number(value).toString(16);

function setStatus(host,message,state="info"){
  const status=host.querySelector("[data-status]");
  if(!status)return;
  status.textContent=message;
  status.dataset.state=state;
  emit("status",{message,state});
}

async function connect(host){
  provider=window.ethereum;
  if(!provider)throw new Error("No compatible browser wallet was detected.");
  const accounts=await provider.request({method:"eth_requestAccounts"});
  account=accounts&&accounts[0];
  if(!account)throw new Error("The wallet did not return an account.");
  const button=host.querySelector("[data-connect]");
  if(button)button.textContent=short(account);
  setStatus(host,"Wallet connected","success");
  emit("wallet:connected",{account});
  return account;
}

async function ensureChain(chainId){
  const current=await provider.request({method:"eth_chainId"});
  if(Number.parseInt(String(current),16)===Number(chainId))return;
  await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:hexChain(chainId)}]});
  emit("chain:switched",{chainId});
}

async function runAction(host,action,card){
  try{
    if(!account)await connect(host);
    await ensureChain(action.chainId);
    const values=[...card.querySelectorAll("[data-arg]")].map((element)=>element.value);
    setStatus(host,"Preparing "+action.title+"…");
    const {transaction}=prepareContractTransaction(action,account,values);
    emit("transaction:requested",{actionId:action.id,transaction});
    setStatus(host,"Confirm the transaction in your wallet…");
    const hash=await provider.request({method:"eth_sendTransaction",params:[transaction]});
    setStatus(host,"Transaction submitted: "+short(hash),"success");
    emit("transaction:submitted",{actionId:action.id,hash});
    const result=card.querySelector("[data-result]");
    if(result)result.textContent=hash;
    return hash;
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    setStatus(host,message,"error");
    emit("transaction:error",{actionId:action.id,message});
    throw error;
  }
}

function element(tag,className,text){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
}

function renderAction(host,action){
  const card=element("article","ck-card");
  card.dataset.actionId=action.id;
  card.append(element("h2","ck-action-title",action.title));
  card.append(element("p","ck-description",action.description));
  const inputs=Array.isArray(action.methodAbi.inputs)?action.methodAbi.inputs:[];
  inputs.forEach((input,index)=>{
    const label=element("label","ck-field");
    label.append(element("span","ck-label",(input.name||"Argument "+(index+1))+" · "+input.type));
    const control=document.createElement("input");
    control.dataset.arg=String(index);
    control.value=action.args[index]===undefined?"":typeof action.args[index]==="string"?action.args[index]:JSON.stringify(action.args[index]);
    control.placeholder=input.type||"value";
    label.append(control);
    card.append(label);
  });
  const button=element("button","ck-action",action.ctaLabel);
  button.type="button";
  button.addEventListener("click",()=>void runAction(host,action,card));
  card.append(button);
  const result=element("div","ck-result");
  result.dataset.result="";
  card.append(result);
  return card;
}

function mount(){
  let container=document.querySelector(CONFIG.mountSelector);
  if(!container){
    container=document.createElement("div");
    container.setAttribute("data-contractkit-root","");
    document.body.append(container);
  }
  const shadow=container.shadowRoot||container.attachShadow({mode:"open"});
  shadow.replaceChildren();
  const style=document.createElement("style");
  style.textContent=":host{all:initial}.ck-shell{box-sizing:border-box;width:min(94vw,980px);margin:32px auto;padding:clamp(24px,5vw,52px);border:1px solid #2b2f39;border-radius:28px;background:radial-gradient(circle at 90% 0,rgba(124,92,255,.22),transparent 38%),#0b0d12;color:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,sans-serif;box-shadow:0 30px 100px rgba(0,0,0,.38)}.ck-top{display:flex;gap:24px;align-items:flex-start;justify-content:space-between}.ck-badge{color:#9f8cff;font:800 11px/1.2 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase}.ck-title{max-width:760px;margin:18px 0 14px;font-size:clamp(34px,7vw,72px);line-height:.94;letter-spacing:-.05em}.ck-copy,.ck-description{color:#98a2b3;line-height:1.6}.ck-connect,.ck-action{border:0;border-radius:14px;background:#9f8cff;color:#08090d;min-height:48px;padding:0 20px;font-weight:850;cursor:pointer}.ck-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px;margin-top:32px}.ck-card{border:1px solid #292d36;border-radius:20px;background:#11141b;padding:22px}.ck-action-title{margin:0;font-size:20px}.ck-field{display:block;margin:14px 0}.ck-label{display:block;margin-bottom:7px;color:#a8b0bf;font:700 11px/1.4 ui-monospace,monospace}.ck-field input{box-sizing:border-box;width:100%;min-height:44px;border:1px solid #303540;border-radius:11px;background:#090b10;color:#fff;padding:0 12px}.ck-action{width:100%;margin-top:8px}.ck-status{min-height:22px;margin-top:18px;color:#a8b0bf;font-size:13px}.ck-status[data-state=error]{color:#fda4af}.ck-status[data-state=success]{color:#86efac}.ck-result{overflow-wrap:anywhere;margin-top:12px;color:#a8b0bf;font:12px/1.5 ui-monospace,monospace}@media(max-width:640px){.ck-top{display:block}.ck-connect{margin-top:18px;width:100%}}";
  const shell=element("section","ck-shell");
  const top=element("div","ck-top");
  const intro=element("div","ck-intro");
  intro.append(element("div","ck-badge",CONFIG.hero.badge),element("h1","ck-title",CONFIG.hero.title),element("p","ck-copy",CONFIG.hero.copy));
  const connectButton=element("button","ck-connect","Connect Wallet");
  connectButton.type="button";
  connectButton.dataset.connect="";
  connectButton.addEventListener("click",()=>void connect(shadow));
  top.append(intro,connectButton);
  const grid=element("div","ck-grid");
  CONFIG.actions.forEach((action)=>grid.append(renderAction(shadow,action)));
  const status=element("div","ck-status","Ready");
  status.dataset.status="";
  status.setAttribute("role","status");
  status.setAttribute("aria-live","polite");
  shell.append(top,grid,status);
  shadow.append(style,shell);
  mountedContainer=container;
  emit("mounted",{actionIds:CONFIG.actions.map((action)=>action.id)});
  return container;
}

window.ContractKitFrontend={
  config:CONFIG,
  mount,
  root:()=>mountedContainer,
  connect:()=>connect(mountedContainer?.shadowRoot||document),
  runAction(id){
    const action=CONFIG.actions.find((item)=>item.id===id);
    if(!action)throw new Error("Unknown action: "+id);
    const host=mountedContainer?.shadowRoot;
    const card=host?.querySelector('[data-action-id="'+CSS.escape(id)+'"]');
    if(!host||!card)throw new Error("Frontend is not mounted");
    return runAction(host,action,card);
  },
  on(name,handler){const current=listeners.get(name)||[];current.push(handler);listeners.set(name,current);return()=>{listeners.set(name,(listeners.get(name)||[]).filter((item)=>item!==handler));};}
};

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
`;
}

export async function compileFrontpageScript(
  config: FrontpageConfig,
  options: { mountSelector?: string } = {},
): Promise<CompiledFrontpageScript> {
  if (config.ecosystem !== "evm") throw new Error("The standalone frontend compiler currently supports EVM projects");
  const actions = deriveCompiledActionsFromFrontpage(config);
  const result = await build({
    stdin: {
      contents: browserEntry(config, actions, options.mountSelector || "[data-contractkit-root]"),
      loader: "js",
      resolveDir: process.cwd(),
      sourcefile: "contractkit-frontend-entry.js",
    },
    bundle: true,
    minify: true,
    format: "iife",
    platform: "browser",
    target: ["es2020"],
    write: false,
    legalComments: "none",
  });
  const output = result.outputFiles[0]?.text;
  if (!output) throw new Error("The frontend compiler did not produce script output");
  return {
    filename: "script.js",
    contentType: "application/javascript; charset=utf-8",
    scriptTag: '<script src="./script.js" defer></script>',
    script: output,
    actions,
  };
}
