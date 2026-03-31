// Bytecodes inlined at build time — artifacts not available at Vercel build

// ─── ABIs ────────────────────────────────────────────────────────────────────

export const SIMPLE_ESCROW_ABI = [
  // State variables
  { type: "function", name: "state",       inputs: [], outputs: [{ type: "uint8" }],    stateMutability: "view" },
  { type: "function", name: "depositor",   inputs: [], outputs: [{ type: "address" }],  stateMutability: "view" },
  { type: "function", name: "beneficiary", inputs: [], outputs: [{ type: "address" }],  stateMutability: "view" },
  { type: "function", name: "arbiter",     inputs: [], outputs: [{ type: "address" }],  stateMutability: "view" },
  { type: "function", name: "amount",      inputs: [], outputs: [{ type: "uint256" }],  stateMutability: "view" },
  // Write
  { type: "function", name: "deposit",        inputs: [], outputs: [], stateMutability: "payable" },
  { type: "function", name: "release",        inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "dispute",        inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRelease", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRefund",  inputs: [], outputs: [], stateMutability: "nonpayable" },
  // Events
  { type: "event", name: "Deposited", inputs: [{ name: "depositor", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "Released",  inputs: [{ name: "to",        type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "Refunded",  inputs: [{ name: "to",        type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "Disputed",  inputs: [{ name: "by",        type: "address", indexed: true }] },
] as const;

export const MILESTONE_ESCROW_ABI = [
  // State variables
  { type: "function", name: "depositor",      inputs: [],                            outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "beneficiary",    inputs: [],                            outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "arbiter",        inputs: [],                            outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "totalDeposited", inputs: [],                            outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "funded",         inputs: [],                            outputs: [{ type: "bool" }],    stateMutability: "view" },
  { type: "function", name: "milestoneCount", inputs: [],                            outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "milestones",     inputs: [{ name: "index", type: "uint256" }], outputs: [{ name: "description", type: "string" }, { name: "amount", type: "uint256" }, { name: "state", type: "uint8" }], stateMutability: "view" },
  // Write
  { type: "function", name: "fund",              inputs: [],                                    outputs: [], stateMutability: "payable" },
  { type: "function", name: "releaseMilestone",  inputs: [{ name: "index", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "disputeMilestone",  inputs: [{ name: "index", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRelease",    inputs: [{ name: "index", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRefund",     inputs: [{ name: "index", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  // Events
  { type: "event", name: "Funded",              inputs: [{ name: "total",  type: "uint256", indexed: false }] },
  { type: "event", name: "MilestoneReleased",   inputs: [{ name: "index",  type: "uint256", indexed: true  }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "MilestoneDisputed",   inputs: [{ name: "index",  type: "uint256", indexed: true  }] },
  { type: "event", name: "MilestoneRefunded",   inputs: [{ name: "index",  type: "uint256", indexed: true  }, { name: "amount", type: "uint256", indexed: false }] },
] as const;

// ─── Bytecode ─────────────────────────────────────────────────────────────────

export const SIMPLE_ESCROW_BYTECODE    = "0x60e0346101bc57601f6108d438819003918201601f191683019291906001600160401b038411838510176101c15781606092849260409687528339810103126101bc5761004b816101d7565b906100638361005c602084016101d7565b92016101d7565b60017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0055916001600160a01b038082161561018457808316156101405783161561010a5760805260a05260c05260ff1960015416600155516106e890816101ec823960805181818160ee0152818161024f015281816102f2015261049c015260a0518181816103ec01526105c3015260c05181818160a40152818161038c015261043c0152f35b835162461bcd60e51b815260206004820152600f60248201526e24b73b30b634b21030b93134ba32b960891b6044820152606490fd5b845162461bcd60e51b815260206004820152601360248201527f496e76616c69642062656e6566696369617279000000000000000000000000006044820152606490fd5b845162461bcd60e51b815260206004820152601160248201527024b73b30b634b2103232b837b9b4ba37b960791b6044820152606490fd5b600080fd5b634e487b7160e01b600052604160045260246000fd5b51906001600160a01b03821682036101bc5756fe6040608081526004908136101561001557600080fd5b600091823560e01c908163318b82e21461041b57816338af3eed146103d75781637e07fd341461037457816386d1a69f146102da578163aa8c217c146102bd578163c19d93fb1461027e578163c7c4ff461461023a578163d0e30db014610183578163f240f7c3146100d7575063fe25e00a1461009157600080fd5b346100d357816003193601126100d357517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b5080fd5b833461018057806003193601126101805761011c337f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031614610634565b60015460ff811692600584101561016d575061013d60016003939414610569565b60ff191617600155337f695fbf2fe28b4fde5705122279ffc4160ebfc0f45e4d96f7e6699001be5062ef8280a280f35b634e487b7160e01b835260219052602482fd5b80fd5b905082600319360112610236576001549060ff82166005811015610223576101ab9015610569565b34156101ed575060019034845560ff191617600155513481527f2da466a7b24304f47e87fa2e1e5a81b9831ce54fec19055ce277ca2f39ba42c460203392a280f35b606490602084519162461bcd60e51b8352820152601060248201526f04d757374206465706f736974203e20360841b6044820152fd5b634e487b7160e01b855260218252602485fd5b8280fd5b5050346100d357816003193601126100d357517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b8383346100d357816003193601126100d35760ff6001541690519160058210156102aa57602083838152f35b634e487b7160e01b815260218452602490fd5b5050346100d357816003193601126100d357602091549051908152f35b8390346100d357816003193601126100d357610320337f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031614610634565b60ff6001541690600582101561016d5750600161033d9114610569565b610345610670565b61034d6105a5565b60017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f005580f35b8390346100d357816003193601126100d3576103ba337f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03161461052f565b60ff6001541690600582101561016d5750600361033d9114610569565b5050346100d357816003193601126100d357517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b9050346102365782600319360112610236576001600160a01b0390610463337f000000000000000000000000000000000000000000000000000000000000000084161461052f565b60ff6001541660058110156102235784809381936104846003849514610569565b61048c610670565b60ff1960015416176001558154907f000000000000000000000000000000000000000000000000000000000000000016807fd7dee2702d63ad89917b6a4da9981c90c4d24f8c2bdfd64c604ecae57d8d065160208951858152a2828215610526575bf11561051c575060017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f005580f35b51903d90823e3d90fd5b506108fc6104ee565b1561053657565b60405162461bcd60e51b815260206004820152600b60248201526a2737ba1030b93134ba32b960a91b6044820152606490fd5b1561057057565b60405162461bcd60e51b815260206004820152600d60248201526c496e76616c696420737461746560981b6044820152606490fd5b600260ff196001541617600155600080808080805460018060a01b037f000000000000000000000000000000000000000000000000000000000000000016807fb21fb52d5749b80f3182f8c6992236b5e5576681880914484d7f4c9b062e619e6020604051858152a282821561062b575bf11561061f5750565b604051903d90823e3d90fd5b506108fc610616565b1561063b57565b60405162461bcd60e51b815260206004820152600d60248201526c2737ba103232b837b9b4ba37b960991b6044820152606490fd5b7f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0060028154146106a05760029055565b604051633ee5aeb560e01b8152600490fdfea264697066735822122066ea20de07ae5d56ec8406c74664093b6a521f7edd5cba341c1dae56df65fef564736f6c63430008180033" as `0x${string}`;
export const MILESTONE_ESCROW_BYTECODE = "0x604060e081523462000629576200111c803803806200001e81620006db565b928339810160a0828203126200062957620000398262000701565b620000476020840162000701565b6200005485850162000701565b60608501519092906001600160401b038111620006295785019484601f870112156200062957855195620000926200008c8862000716565b620006db565b9660208089838152019160051b83010191878311620006295760208101915b8383106200062e57505050506080810151906001600160401b0382116200062957019380601f8601121562000629578451620000f16200008c8262000716565b9560208088848152019260051b8201019283116200062957602001905b8282106200061857505060017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0055506001600160a01b0381811615620005e057808316156200059c57831615620005665784518451036200053057845115620004fc5760805260a05260c052600090815b8351831015620004a6576200019583836200072e565b51156200046257620001a883856200072e565b51620001b584846200072e565b51865191606083016001600160401b03811184821017620004365788528252602082015260008682015260005468010000000000000000811015620004365760018101806000558110156200044c57600080528151805190917f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563916001600160401b03811162000436576003820283015493600185811c951680156200042b575b6020861014620004155784601f8c9611620003b2575b50602090601f83116001146200032e579180600295949260039460009262000322575b50508160011b9160001990851b1c1916178282028401555b602086015160018383028501015502010191015190600491828110156200030d5760ff80198354169116179055620002e084846200072e565b518201809211620002f857506001909201916200017f565b601190634e487b7160e01b6000525260246000fd5b602183634e487b7160e01b6000525260246000fd5b0151905038806200028f565b600384939296959402840160005260206000209060005b601f198416811062000396575091600191600296976003959483601f198116106200037d575b505050811b01828202840155620002a7565b015160001983871b60f8161c191690553880806200036b565b8188015183556020978801978e97506001909301920162000345565b9091929394506003840285016000526020600020601f840160051c810191602085106200040a575b90601f8d9796959493920160051c01905b818110620003fa57506200026c565b600081558c9650600101620003eb565b9091508190620003da565b634e487b7160e01b600052602260045260246000fd5b94607f169462000256565b634e487b7160e01b600052604160045260246000fd5b634e487b7160e01b600052603260045260246000fd5b845162461bcd60e51b815260206004820152601c60248201527f4d696c6573746f6e6520616d6f756e74206d757374206265203e2030000000006044820152606490fd5b60015583516109d890816200074482396080518181816102db015281816103990152818161055a015261075f015260a05181818161069d015261070b015260c05181818160de015281816104b101526105f50152f35b855162461bcd60e51b815260206004820152600d60248201526c4e6f206d696c6573746f6e657360981b6044820152606490fd5b855162461bcd60e51b815260206004820152600f60248201526e098cadccee8d040dad2e6dac2e8c6d608b1b6044820152606490fd5b855162461bcd60e51b815260206004820152600f60248201526e24b73b30b634b21030b93134ba32b960891b6044820152606490fd5b865162461bcd60e51b815260206004820152601360248201527f496e76616c69642062656e6566696369617279000000000000000000000000006044820152606490fd5b865162461bcd60e51b815260206004820152601160248201527024b73b30b634b2103232b837b9b4ba37b960791b6044820152606490fd5b81518152602091820191016200010e565b600080fd5b82516001600160401b0381116200062957820189603f82011215620006295760208101516001600160401b038111620006c6578c918b62000679601f8401601f1916602001620006db565b938385528383010111620006295760008e5b838210620006af5750505091816000602080958195010152815201920191620000b1565b906020918184010151828287010152018e6200068b565b60246000634e487b7160e01b81526041600452fd5b6040519190601f01601f191682016001600160401b038111838210176200043657604052565b51906001600160a01b03821682036200062957565b6001600160401b038111620004365760051b60200190565b80518210156200044c5760209160051b01019056fe608060408181526004918236101561001657600080fd5b600092833560e01c9182630681ca55146107d457508163317debf51461073a57816338af3eed146106f65781633f4e7c0b146105d05781634c909aa91461048c578163b60d4288146103c8578163c7c4ff4614610384578163d82d7d80146102bf578163e89e4ed61461013057508063f3a504f21461010d578063fe25e00a146100ca5763ff50abdc146100a957600080fd5b346100c657816003193601126100c6576020906001549051908152f35b5080fd5b50346100c657816003193601126100c657517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b50346100c657816003193601126100c65760209060ff6002541690519015158152f35b8284346102bc576020806003193601126100c657833582548110156102b857610158906107ee565b5092805192809585549660018860011c986001811680156102ae575b878b10811461029b578a895290811561027c5750600114610244575b50859003601f01601f19908116860197509567ffffffffffffffff8811868910176102315787845260ff600260018301549201541694606089528651968760608b015281855b89811061021c57505050836080888b01015288015280841015610209578660808188601f89898985015201168101030190f35b634e487b7160e01b825260219052602490fd5b828101820151818d01608001528391016101d6565b634e487b7160e01b835260418252602483fd5b9790508683528483209783985b828a1061026957505050838596978601018796610190565b8054888b01880152988601988101610251565b60ff191688880152509697889750151560051b86018501905085610190565b634e487b7160e01b865260228552602486fd5b99607f1699610174565b8280fd5b80fd5b8390346100c65760203660031901126100c657803590610309337f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03161461083c565b61031760ff60025416610878565b6002610322836107ee565b50019081549060ff82169080821015610371575090610343600292156108b1565b60ff19161790557ffddf026dc0fe8019554601c148f631302e8f8fe8d383e71165001e38f0830b618280a280f35b634e487b7160e01b865260219052602485fd5b5050346100c657816003193601126100c657517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b9050826003193601126102b8576002549060ff8216610458576001543403610422575060ff1916600117600255513481527fc4c14883ae9fd8e26d5d59e3485ed29fd126d781d7e498a4ca5c54c8268e493690602090a180f35b606490602084519162461bcd60e51b8352820152601060248201526f125b98dbdc9c9958dd08185b5bdd5b9d60821b6044820152fd5b606490602084519162461bcd60e51b8352820152600e60248201526d105b1c9958591e48199d5b99195960921b6044820152fd5b9050346102b85760203660031901126102b8578035906001600160a01b03906104d8337f00000000000000000000000000000000000000000000000000000000000000008416146108eb565b6104e0610960565b6104e9836107ee565b5090600282019081549060ff821690808210156105bd5750936001889692948796946003889761051c60028a9914610925565b60ff19161790550154917f9b0ea444e9e2f5329d302a1a5cc179077359d71dfc083cfcf88360adfa01b30960208951858152a2829082156105b3575b7f00000000000000000000000000000000000000000000000000000000000000001690f1156105a9575060017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f005580f35b51903d90823e3d90fd5b6108fc9150610558565b634e487b7160e01b895260219052602488fd5b9050346102b85760203660031901126102b8578035906001600160a01b039061061c337f00000000000000000000000000000000000000000000000000000000000000008416146108eb565b610624610960565b61062d836107ee565b5090600282019081549060ff821690808210156105bd57509360018896929487969482889761065f60028a9914610925565b60ff19161790550154917f9e069181c12760c2cd0078ed4facdbe1f3614543b0fbff5dbcac3cbc61a0b64e60208951858152a2829082156106ec575b7f00000000000000000000000000000000000000000000000000000000000000001690f1156105a9575060017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f005580f35b6108fc915061069b565b5050346100c657816003193601126100c657517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b9050346102b85760203660031901126102b8578035906001600160a01b0390610786337f000000000000000000000000000000000000000000000000000000000000000084161461083c565b61078e610960565b61079c60ff60025416610878565b6107a5836107ee565b5090600282019081549060ff821690808210156105bd578888818080808c8c60018d8d828e61065f8f156108b1565b8490346100c657816003193601126100c657602091548152f35b90600091825481101561082857600390838052027f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563019190565b634e487b7160e01b83526032600452602483fd5b1561084357565b60405162461bcd60e51b815260206004820152600d60248201526c2737ba103232b837b9b4ba37b960991b6044820152606490fd5b1561087f57565b60405162461bcd60e51b815260206004820152600a602482015269139bdd08199d5b99195960b21b6044820152606490fd5b156108b857565b60405162461bcd60e51b815260206004820152600b60248201526a4e6f742070656e64696e6760a81b6044820152606490fd5b156108f257565b60405162461bcd60e51b815260206004820152600b60248201526a2737ba1030b93134ba32b960a91b6044820152606490fd5b1561092c57565b60405162461bcd60e51b815260206004820152600c60248201526b139bdd08191a5cdc1d5d195960a21b6044820152606490fd5b7f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0060028154146109905760029055565b604051633ee5aeb560e01b8152600490fdfea2646970667358221220d66e116b3620938883ee4756e452d1ea04ed2c5d00a61c41fe7eaac7c4de1ea364736f6c63430008180033" as `0x${string}`;

// ─── AIArbiter ABI ────────────────────────────────────────────────────────────

export const AI_ARBITER_ABI = [
  // Write
  { type: "function", name: "submitEvidence",           inputs: [{ name: "escrowAddress", type: "address" }, { name: "evidenceURI", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRelease",           inputs: [{ name: "escrowAddress", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveRefund",            inputs: [{ name: "escrowAddress", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveMilestoneRelease",  inputs: [{ name: "escrowAddress", type: "address" }, { name: "milestoneIndex", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveMilestoneRefund",   inputs: [{ name: "escrowAddress", type: "address" }, { name: "milestoneIndex", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setOracleSigner",          inputs: [{ name: "newSigner", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  // Views
  { type: "function", name: "owner",              inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "oracleSigner",       inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "getEvidenceCount",   inputs: [{ name: "escrowAddress", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getEvidence",        inputs: [{ name: "escrowAddress", type: "address" }, { name: "index", type: "uint256" }], outputs: [{ name: "submitter", type: "address" }, { name: "uri", type: "string" }, { name: "submittedAt", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getAllEvidence",     inputs: [{ name: "escrowAddress", type: "address" }], outputs: [{ type: "tuple[]", components: [{ name: "submitter", type: "address" }, { name: "uri", type: "string" }, { name: "submittedAt", type: "uint256" }] }], stateMutability: "view" },
  // Events
  { type: "event", name: "EvidenceSubmitted",   inputs: [{ name: "escrow", type: "address", indexed: true }, { name: "submitter", type: "address", indexed: true }, { name: "evidenceURI", type: "string", indexed: false }] },
  { type: "event", name: "DisputeResolved",     inputs: [{ name: "escrow", type: "address", indexed: true }, { name: "resolution", type: "string", indexed: false }] },
  { type: "event", name: "OracleSignerUpdated", inputs: [{ name: "newSigner", type: "address", indexed: true }] },
] as const;

// ─── EscrowFactory ABI ───────────────────────────────────────────────────────

export const ESCROW_FACTORY_ABI = [
  // Write
  { type: "function", name: "createSimpleEscrow",    inputs: [{ name: "beneficiary", type: "address" }, { name: "arbiter", type: "address" }, { name: "trustTier", type: "uint8" }, { name: "useAIArbiter", type: "bool" }], outputs: [{ type: "address" }], stateMutability: "payable" },
  { type: "function", name: "createMilestoneEscrow", inputs: [{ name: "beneficiary", type: "address" }, { name: "arbiter", type: "address" }, { name: "descriptions", type: "string[]" }, { name: "amounts", type: "uint256[]" }, { name: "trustTier", type: "uint8" }, { name: "useAIArbiter", type: "bool" }], outputs: [{ type: "address" }], stateMutability: "payable" },
  { type: "function", name: "setAIArbiter",          inputs: [{ name: "_aiArbiter", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  // Views
  { type: "function", name: "escrowCount",              inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "escrows",                  inputs: [{ name: "index", type: "uint256" }], outputs: [{ name: "contractAddress", type: "address" }, { name: "escrowType", type: "uint8" }, { name: "depositor", type: "address" }, { name: "beneficiary", type: "address" }, { name: "arbiter", type: "address" }, { name: "totalAmount", type: "uint256" }, { name: "trustTier", type: "uint8" }, { name: "createdAt", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getEscrowsByDepositor",    inputs: [{ name: "depositor", type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "getEscrowsByBeneficiary",  inputs: [{ name: "beneficiary", type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "getEscrows",               inputs: [{ name: "offset", type: "uint256" }, { name: "limit", type: "uint256" }], outputs: [{ type: "tuple[]", components: [{ name: "contractAddress", type: "address" }, { name: "escrowType", type: "uint8" }, { name: "depositor", type: "address" }, { name: "beneficiary", type: "address" }, { name: "arbiter", type: "address" }, { name: "totalAmount", type: "uint256" }, { name: "trustTier", type: "uint8" }, { name: "createdAt", type: "uint256" }] }], stateMutability: "view" },
  { type: "function", name: "escrowIndex",              inputs: [{ name: "addr", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  // Events
  { type: "event", name: "SimpleEscrowCreated",    inputs: [{ name: "contractAddress", type: "address", indexed: true }, { name: "depositor", type: "address", indexed: true }, { name: "beneficiary", type: "address", indexed: true }, { name: "arbiter", type: "address", indexed: false }, { name: "amount", type: "uint256", indexed: false }, { name: "trustTier", type: "uint8", indexed: false }] },
  { type: "event", name: "MilestoneEscrowCreated", inputs: [{ name: "contractAddress", type: "address", indexed: true }, { name: "depositor", type: "address", indexed: true }, { name: "beneficiary", type: "address", indexed: true }, { name: "arbiter", type: "address", indexed: false }, { name: "totalAmount", type: "uint256", indexed: false }, { name: "trustTier", type: "uint8", indexed: false }] },
] as const;

// ─── TrustScoreOracle ABI ─────────────────────────────────────────────────────

export const TRUST_ORACLE_ABI = [
  { type: "function", name: "getTier",          inputs: [{ name: "wallet", type: "address" }], outputs: [{ type: "uint8" }],  stateMutability: "view" },
  { type: "function", name: "getScoreAndTier",  inputs: [{ name: "wallet", type: "address" }], outputs: [{ name: "score", type: "uint8" }, { name: "tier", type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "scores",           inputs: [{ name: "wallet", type: "address" }], outputs: [{ type: "uint8" }],  stateMutability: "view" },
  { type: "function", name: "tier1Threshold",   inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "tier2Threshold",   inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
] as const;

// ─── Contract addresses (from env) ───────────────────────────────────────────

export const FACTORY_ADDRESS     = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS     ?? "") as `0x${string}`;
export const ORACLE_ADDRESS      = (process.env.NEXT_PUBLIC_ORACLE_ADDRESS      ?? "") as `0x${string}`;
export const AI_ARBITER_ADDRESS  = (process.env.NEXT_PUBLIC_AI_ARBITER_ADDRESS  ?? "") as `0x${string}`;

// ─── Chain config ─────────────────────────────────────────────────────────────

export const blockdagTestnet = {
  id: 1404,
  name: "BlockDAG",
  nativeCurrency: { name: "BDAG", symbol: "BDAG", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_BLOCKDAG_RPC ?? "https://rpc.bdagscan.com"],
    },
  },
  blockExplorers: {
    default: { name: "BDAGScan", url: "https://bdagscan.com" },
  },
  testnet: false,
} as const;

export const EXPLORER_TX_URL = (hash: string) =>
  `https://bdagscan.com/tx/${hash}`;

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum SimpleEscrowState {
  AWAITING_PAYMENT  = 0,
  AWAITING_DELIVERY = 1,
  COMPLETE          = 2,
  DISPUTED          = 3,
  REFUNDED          = 4,
}

export enum MilestoneState {
  PENDING  = 0,
  RELEASED = 1,
  DISPUTED = 2,
  REFUNDED = 3,
}

export const SIMPLE_STATE_LABEL: Record<number, string> = {
  0: "Awaiting Payment",
  1: "Awaiting Delivery",
  2: "Complete",
  3: "Disputed",
  4: "Refunded",
};

export const MILESTONE_STATE_LABEL: Record<number, string> = {
  0: "Pending",
  1: "Released",
  2: "Disputed",
  3: "Refunded",
};
