/* Teste de fumaca. Suba o servidor (npx cds-tsx serve all --port 4004) e rode: node test/scripts/smoke.js */
const WebSocket = require('ws');
const sharp = require('sharp');

const HOST = process.env.RESENHA_HOST || 'localhost:4004';
const GERAL = '00000000-0000-4000-8000-000000000001';
const PROJETO = '00000000-0000-4000-8000-000000000002';
const DAVI = 'a0000000-0000-4000-8000-000000000001';
const ANA = 'a0000000-0000-4000-8000-000000000002';
const JOAO = 'a0000000-0000-4000-8000-000000000003';

async function http(method, path, token, body) {
    const oResponse = await fetch(`http://${HOST}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined
    });
    const sText = await oResponse.text();

    return { status: oResponse.status, body: sText ? JSON.parse(sText) : null };
}

async function login(Login) {
    const oResult = await http('POST', '/auth/login', null, { Login, Password: '123456' });

    return oResult.body.AccessToken;
}

function connect(token) {
    return new Promise((resolve, reject) => {
        const oSocket = new WebSocket(`ws://${HOST}/ws?token=${token}`);
        const aEvents = [];

        oSocket.on('message', (oData) => aEvents.push(JSON.parse(oData.toString())));
        oSocket.on('open', () => resolve({ socket: oSocket, events: aEvents }));
        oSocket.on('unexpected-response', (_req, oRes) => reject(new Error(`ws rejected ${oRes.statusCode}`)));
        oSocket.on('error', reject);
    });
}

const wait = (iMs) => new Promise((resolve) => setTimeout(resolve, iMs));

function check(sName, bOk, oDetail) {
    console.log(`${bOk ? 'OK  ' : 'FAIL'} ${sName}${bOk ? '' : ' -> ' + JSON.stringify(oDetail)}`);

    if (!bOk) {
        process.exitCode = 1;
    }
}

const find = (aRows, sId) => aRows.find((oRow) => oRow.ID === sId);

async function raw(sMethod, sPath, sToken, Body, oHeaders = {}) {
    const oResponse = await fetch(`http://${HOST}${sPath}`, {
        method: sMethod,
        headers: { ...(sToken ? { Authorization: `Bearer ${sToken}` } : {}), ...oHeaders },
        body: Body
    });

    return { status: oResponse.status, headers: oResponse.headers, buffer: Buffer.from(await oResponse.arrayBuffer()) };
}

async function mediaTokenOf(Login) {
    const oResult = await http('POST', '/auth/login', null, { Login, Password: '123456' });

    return oResult.body.MediaToken;
}

const createUpload = (sToken, Body) => http('POST', '/service/Chat/CreateUpload', sToken, Body);

const sendUpload = (sToken, Body) => http('POST', '/service/Chat/SendMessage', sToken, Body);

const CACHE_HEADER = 'private, max-age=31536000, immutable';

async function mediaChecks(sDavi, sAna, sJoao, oAnaWs) {
    const sDaviMt = await mediaTokenOf('davi');
    const sAnaMt = await mediaTokenOf('ana@resenha.dev');
    const sJoaoMt = await mediaTokenOf('joao');
    const sPng = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#2a7' } }).png().toBuffer();
    const sJpeg = await sharp({ create: { width: 300, height: 200, channels: 3, background: '#36c' } }).jpeg().toBuffer();
    const sPdf = Buffer.from('%PDF-1.4 relatorio de teste');

    const oImageUpload = await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'Image', MimeType: 'image/png', FileName: 'foto.png', Size: sPng.length });
    const sImageId = oImageUpload.body.ID;
    check('CreateUpload devolve ID', oImageUpload.status === 200 && !!sImageId, oImageUpload);
    check('PUT Content grava (204)', (await raw('PUT', `/service/Chat/Uploads(${sImageId})/Content`, sDavi, sPng, { 'Content-Type': 'image/png' })).status === 204);
    const oImage = await http('GET', `/service/Chat/Uploads(${sImageId})`, sDavi);
    check('imagem regravada em webp 800x600', oImage.body.MimeType === 'image/webp' && oImage.body.Width === 800 && oImage.body.Height === 600, oImage.body);

    const oSent = await sendUpload(sDavi, { Conversation_ID: GERAL, Upload_ID: sImageId });
    check('SendMessage com Upload_ID sem texto', oSent.status < 300 && oSent.body.Kind === 'Image', oSent);
    const oExpanded = await http('GET', `/service/Chat/Messages?$filter=ID eq ${oSent.body.ID}&$expand=Attachment`, sDavi);
    const sAttachmentId = oExpanded.body.value?.[0]?.Attachment?.ID;
    check('Messages $expand=Attachment traz o anexo', !!sAttachmentId, oExpanded.body);

    const oThumb = await raw('GET', `/service/Chat/Attachments(${sAttachmentId})/Thumbnail?mt=${sDaviMt}`);
    check('Thumbnail com mt = 200 image/webp', oThumb.status === 200 && oThumb.headers.get('content-type') === 'image/webp', oThumb.status);
    check('Thumbnail com cache immutable e nosniff', oThumb.headers.get('cache-control') === CACHE_HEADER && oThumb.headers.get('x-content-type-options') === 'nosniff', oThumb.headers.get('cache-control'));
    check('Thumbnail sem token = 401', (await raw('GET', `/service/Chat/Attachments(${sAttachmentId})/Thumbnail`)).status === 401);
    const oContent = await raw('GET', `/service/Chat/Attachments(${sAttachmentId})/Content?mt=${sDaviMt}`);
    check('Content inline com o MIME real', oContent.status === 200 && oContent.headers.get('content-type') === 'image/webp' && oContent.headers.get('content-disposition').startsWith('inline'), oContent.status);
    check('imagem com download=1 sai como attachment', (await raw('GET', `/service/Chat/Attachments(${sAttachmentId})/Content?mt=${sDaviMt}&download=1`)).headers.get('content-disposition').startsWith('attachment'));
    check('token de acesso em mt = 401', (await raw('GET', `/service/Chat/Attachments(${sAttachmentId})/Content?mt=${sDavi}`)).status === 401);
    check('token de midia no Authorization = 401', (await raw('GET', '/service/Chat/Conversations', sDaviMt)).status === 401);
    const oProjectUpload = await createUpload(sDavi, { Conversation_ID: PROJETO, Kind: 'Image', MimeType: 'image/png', FileName: 'projeto.png', Size: sPng.length });
    await raw('PUT', `/service/Chat/Uploads(${oProjectUpload.body.ID})/Content`, sDavi, sPng, { 'Content-Type': 'image/png' });
    const oProjectSent = await sendUpload(sDavi, { Conversation_ID: PROJETO, Upload_ID: oProjectUpload.body.ID });
    const oProjectExpanded = await http('GET', `/service/Chat/Messages?$filter=ID eq ${oProjectSent.body.ID}&$expand=Attachment`, sDavi);
    const sProjectAttachmentId = oProjectExpanded.body.value?.[0]?.Attachment?.ID;
    check('joao nao le anexo de grupo alheio (403/404)', [403, 404].includes((await raw('GET', `/service/Chat/Attachments(${sProjectAttachmentId})/Content?mt=${sJoaoMt}`)).status));
    check('joao nao le metadado de anexo de grupo alheio', [403, 404].includes((await http('GET', `/service/Chat/Attachments(${sProjectAttachmentId})`, sJoao)).status));

    check('arquivo acima de 25 MB = 413', (await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'File', MimeType: 'application/pdf', FileName: 'grande.pdf', Size: 26 * 1024 * 1024 })).status === 413);
    const oDeclared = await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'Image', MimeType: 'image/png', FileName: 'pequena.png', Size: 100 });
    check('PUT acima do Size declarado = 413', (await raw('PUT', `/service/Chat/Uploads(${oDeclared.body.ID})/Content`, sDavi, sPng, { 'Content-Type': 'image/png' })).status === 413);
    const oMismatchUpload = await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'Image', MimeType: 'image/png', FileName: 'troca.png', Size: sPng.length });
    check('PUT com Content-Type diferente = 400', (await raw('PUT', `/service/Chat/Uploads(${oMismatchUpload.body.ID})/Content`, sDavi, sPng, { 'Content-Type': 'image/jpeg' })).status === 400);
    check('extensao executavel = 400', (await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'File', MimeType: 'application/octet-stream', FileName: 'virus.exe', Size: 100 })).status === 400);
    check('MIME svg em imagem = 400', (await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'Image', MimeType: 'image/svg+xml', FileName: 'x.svg', Size: 100 })).status === 400);
    check('largura acima de 10000 = 400', (await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'Video', MimeType: 'video/mp4', FileName: 'v.mp4', Size: 100, Width: 20000 })).status === 400);
    check('duracao acima de 3600 = 400', (await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'Video', MimeType: 'video/mp4', FileName: 'v.mp4', Size: 100, DurationSeconds: 4000 })).status === 400);

    const oPending = await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'Image', MimeType: 'image/png', FileName: 'pendente.png', Size: 100 });
    check('SendMessage antes do envio concluido = 400', (await sendUpload(sDavi, { Conversation_ID: GERAL, Upload_ID: oPending.body.ID })).status === 400);
    check('reenvio do mesmo upload = 409', (await sendUpload(sDavi, { Conversation_ID: GERAL, Upload_ID: sImageId })).status === 409);

    const oPdfUpload = await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'File', MimeType: 'application/pdf', FileName: 'relatorio.pdf', Size: sPdf.length });
    check('PUT do PDF = 204', (await raw('PUT', `/service/Chat/Uploads(${oPdfUpload.body.ID})/Content`, sDavi, sPdf, { 'Content-Type': 'application/pdf' })).status === 204);
    check('upload de outra conversa = 403', (await sendUpload(sDavi, { Conversation_ID: PROJETO, Upload_ID: oPdfUpload.body.ID })).status === 403);
    const oPdfSent = await sendUpload(sDavi, { Conversation_ID: GERAL, Text: 'Segue o relatorio', Upload_ID: oPdfUpload.body.ID });
    check('SendMessage com legenda no PDF', oPdfSent.status < 300 && oPdfSent.body.Text === 'Segue o relatorio' && oPdfSent.body.Kind === 'File', oPdfSent);
    const oLast = await http('GET', `/service/Chat/Conversations(${GERAL})?$select=LastMessage`, sDavi);
    check('LastMessage da midia com legenda', (oLast.body.LastMessage ?? '').includes('Segue o relatorio'), oLast.body);

    const oPdfExpanded = await http('GET', `/service/Chat/Messages?$filter=ID eq ${oPdfSent.body.ID}&$expand=Attachment`, sDavi);
    const oFile = await raw('GET', `/service/Chat/Attachments(${oPdfExpanded.body.value?.[0]?.Attachment?.ID})/Content?mt=${sDaviMt}`);
    check('PDF baixa como attachment octet-stream', oFile.status === 200 && oFile.headers.get('content-type') === 'application/octet-stream' && oFile.headers.get('content-disposition') === "attachment; filename*=UTF-8''relatorio.pdf", oFile.headers.get('content-disposition'));

    const oBefore = await http('GET', `/service/Chat/Me(${ANA})?$select=AvatarVersion`, sAna);
    const iBefore = oBefore.body.AvatarVersion;
    check('PUT avatar do proprio perfil = 204', (await raw('PUT', `/service/Chat/Me(${ANA})/Avatar`, sAna, sJpeg, { 'Content-Type': 'image/jpeg' })).status === 204);
    const oAfterPut = await http('GET', `/service/Chat/Me(${ANA})?$select=AvatarVersion`, sAna);
    check('AvatarVersion incrementa no PUT', oAfterPut.body.AvatarVersion === iBefore + 1, oAfterPut.body);
    const oAvatar = await raw('GET', `/service/Chat/People(${ANA})/Avatar?v=${iBefore + 1}&mt=${sAnaMt}`);
    check('avatar GET 200 image/webp com cache', oAvatar.status === 200 && oAvatar.headers.get('content-type') === 'image/webp' && oAvatar.headers.get('cache-control') === CACHE_HEADER, oAvatar.status);
    check('avatar sem token = 401', (await raw('GET', `/service/Chat/People(${ANA})/Avatar`)).status === 401);
    const sGif = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#000' } }).gif().toBuffer();
    check('avatar em GIF = 400', (await raw('PUT', `/service/Chat/Me(${ANA})/Avatar`, sAna, sGif, { 'Content-Type': 'image/gif' })).status === 400);
    check('PATCH de Avatar em JSON = 400', (await http('PATCH', `/service/Chat/Me(${ANA})`, sAna, { Avatar: 'AAAA' })).status === 400);

    const oGroup = await http('POST', '/service/Chat/CreateConversation', sDavi, { Kind: 'Group', Name: 'Fotos', MemberIds: [ANA] });
    const sGroupId = oGroup.body.ID;
    check('membro comum nao troca a foto do grupo (403)', (await raw('PUT', `/service/Chat/Conversations(${sGroupId})/Avatar`, sAna, sJpeg, { 'Content-Type': 'image/jpeg' })).status === 403);
    check('dono troca a foto do grupo (204)', (await raw('PUT', `/service/Chat/Conversations(${sGroupId})/Avatar`, sDavi, sJpeg, { 'Content-Type': 'image/jpeg' })).status === 204);
    const oGroupRow = await http('GET', `/service/Chat/Conversations(${sGroupId})?$select=AvatarVersion`, sDavi);
    check('AvatarVersion do grupo = 1', oGroupRow.body.AvatarVersion === 1, oGroupRow.body);
    const oGroupMessages = await fetch(`http://${HOST}/service/Chat/Messages?$filter=Conversation_ID eq ${sGroupId}&$orderby=createdAt desc&$top=1`, { headers: { Authorization: `Bearer ${sDavi}`, 'Accept-Language': 'pt-BR' } }).then((oResponse) => oResponse.json());
    check('aviso de troca de foto no grupo (pt-BR)', (oGroupMessages.value?.[0]?.Text ?? '').includes('mudou a foto'), oGroupMessages);
    check('dono remove a foto do grupo (204)', (await raw('DELETE', `/service/Chat/Conversations(${sGroupId})/Avatar`, sDavi)).status === 204);

    const oDirect = await http('POST', '/service/Chat/StartDirect', sDavi, { User_ID: ANA });
    check('avatar de conversa Direct = 403', (await raw('PUT', `/service/Chat/Conversations(${oDirect.body.ID})/Avatar`, sDavi, sJpeg, { 'Content-Type': 'image/jpeg' })).status === 403);
    const oPeerFlags = await http('GET', `/service/Chat/Members?$filter=Conversation_ID eq ${oDirect.body.ID} and User_ID eq ${ANA}&$expand=Conversation`, sDavi);
    check('Direct expõe DirectPeerHasAvatar/Version do par', oPeerFlags.body.value?.[0]?.Conversation?.DirectPeerHasAvatar === true && oPeerFlags.body.value?.[0]?.Conversation?.DirectPeerAvatarVersion === iBefore + 1, oPeerFlags.body);

    const oChannel = await http('POST', '/service/Chat/CreateConversation', sDavi, { Kind: 'Channel', Name: 'Canal publico', IsPublic: true, MemberIds: [ANA] });
    check('dono troca a foto do canal publico (204)', (await raw('PUT', `/service/Chat/Conversations(${oChannel.body.ID})/Avatar`, sDavi, sJpeg, { 'Content-Type': 'image/jpeg' })).status === 204);
    const oChannelAvatar = await raw('GET', `/service/Chat/PublicChannels(${oChannel.body.ID})/Avatar?mt=${sJoaoMt}`);
    check('nao membro le a foto do canal publico via PublicChannels', oChannelAvatar.status === 200 && oChannelAvatar.headers.get('content-type') === 'image/webp', oChannelAvatar.status);
    check('nao membro nao le Conversations do canal', [403, 404].includes((await raw('GET', `/service/Chat/Conversations(${oChannel.body.ID})/Avatar?mt=${sJoaoMt}`)).status));

    const oDelete = await raw('DELETE', `/service/Chat/Me(${ANA})/Avatar`, sAna);
    check('DELETE avatar = 204', oDelete.status === 204, oDelete.status);
    const oAfterDelete = await http('GET', `/service/Chat/Me(${ANA})?$select=AvatarVersion,AvatarMimeType`, sAna);
    check('DELETE incrementa AvatarVersion e limpa o MIME', oAfterDelete.body.AvatarVersion === iBefore + 2 && oAfterDelete.body.AvatarMimeType === null, oAfterDelete.body);
    check('avatar removido = 204 sem conteudo', (await raw('GET', `/service/Chat/People(${ANA})/Avatar?mt=${sAnaMt}`)).status === 204);

    await wait(400);
    check('ana recebe user.updated do avatar', oAnaWs.events.some((o) => o.type === 'user.updated' && o.payload.UserId === ANA), oAnaWs.events);
    check('ana recebe conversation.updated do grupo', oAnaWs.events.some((o) => o.type === 'conversation.updated' && o.payload.ConversationId === sGroupId), oAnaWs.events);
}

async function securityChecks(sDavi, sAna, sJoao) {
    const sPng = await sharp({ create: { width: 30, height: 30, channels: 3, background: '#f00' } }).png().toBuffer();
    const sJpg = await sharp({ create: { width: 30, height: 30, channels: 3, background: '#0f0' } }).jpeg().toBuffer();
    const sSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="red"/></svg>');
    const sSmallPdf = Buffer.from('%PDF-1.4 teste');

    const oJpegAsPng = await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'Image', MimeType: 'image/png', FileName: 'disfarcado.png', Size: sJpg.length });
    check('JPEG declarado como PNG = 400', (await raw('PUT', `/service/Chat/Uploads(${oJpegAsPng.body.ID})/Content`, sDavi, sJpg, { 'Content-Type': 'image/png' })).status === 400);
    const oSvgAsPng = await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'Image', MimeType: 'image/png', FileName: 'svg.png', Size: sSvg.length });
    check('SVG declarado como PNG = 400', (await raw('PUT', `/service/Chat/Uploads(${oSvgAsPng.body.ID})/Content`, sDavi, sSvg, { 'Content-Type': 'image/png' })).status === 400);
    const oPngAsGif = await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'Image', MimeType: 'image/gif', FileName: 'nao.gif', Size: sPng.length });
    check('PNG declarado como GIF = 400', (await raw('PUT', `/service/Chat/Uploads(${oPngAsGif.body.ID})/Content`, sDavi, sPng, { 'Content-Type': 'image/gif' })).status === 400);

    const oImageThumb = await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'Image', MimeType: 'image/png', FileName: 'miniatura.png', Size: sPng.length });
    check('miniatura enviada pelo cliente em Kind Image = 400', (await raw('PUT', `/service/Chat/Uploads(${oImageThumb.body.ID})/Thumbnail`, sDavi, sJpg, { 'Content-Type': 'image/jpeg' })).status === 400);

    check('extensao .hta bloqueada = 400', (await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'File', MimeType: 'application/octet-stream', FileName: 'x.hta', Size: 10 })).status === 400);
    const oNormalized = await createUpload(sDavi, { Conversation_ID: GERAL, Kind: 'File', MimeType: 'application/pdf', FileName: 'rel\u0001atorio.pdf. ', Size: 10 });
    check('nome normalizado (sem controle e ponto final)', oNormalized.body.FileName === 'relatorio.pdf', oNormalized.body);

    const aQuota = [];
    for (let i = 0; i < 11; i += 1) {
        aQuota.push((await createUpload(sJoao, { Conversation_ID: GERAL, Kind: 'File', MimeType: 'application/pdf', FileName: `cota${i}.pdf`, Size: 10 })).status);
    }
    check('11o upload pendente do mesmo usuario = 429', aQuota[10] === 429 && aQuota.slice(0, 10).every((iStatus) => iStatus === 200), aQuota);

    const oRace = await createUpload(sAna, { Conversation_ID: GERAL, Kind: 'File', MimeType: 'application/pdf', FileName: 'corrida.pdf', Size: sSmallPdf.length });
    await raw('PUT', `/service/Chat/Uploads(${oRace.body.ID})/Content`, sAna, sSmallPdf, { 'Content-Type': 'application/pdf' });
    const [oFirst, oSecond] = await Promise.all([sendUpload(sAna, { Conversation_ID: GERAL, Upload_ID: oRace.body.ID }), sendUpload(sAna, { Conversation_ID: GERAL, Upload_ID: oRace.body.ID })]);
    check('dois envios simultaneos do mesmo upload: um 200 e um 409', [oFirst.status, oSecond.status].sort().join(',') === '200,409', [oFirst.status, oSecond.status]);

    const oDeleteUpload = await createUpload(sAna, { Conversation_ID: GERAL, Kind: 'File', MimeType: 'application/pdf', FileName: 'apagar.pdf', Size: 10 });
    check('DELETE de Content em Uploads = 400', (await raw('DELETE', `/service/Chat/Uploads(${oDeleteUpload.body.ID})/Content`, sAna)).status === 400);

    const oOversized = await createUpload(sAna, { Conversation_ID: GERAL, Kind: 'File', MimeType: 'application/pdf', FileName: 'maior.pdf', Size: 10 });
    const oOversizedPut = await raw('PUT', `/service/Chat/Uploads(${oOversized.body.ID})/Content`, sAna, Buffer.alloc(100, 1), { 'Content-Type': 'application/pdf' });
    check('corpo maior que o Size declarado = 413 sem "0 MB"', oOversizedPut.status === 413 && !oOversizedPut.buffer.toString().includes('0 MB'), oOversizedPut.status);

    const iBefore = (await http('GET', `/service/Chat/Me(${ANA})?$select=AvatarVersion`, sAna)).body.AvatarVersion;
    const sAvatarJpeg = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#36c' } }).jpeg().toBuffer();
    await Promise.all([1, 2].map(() => raw('PUT', `/service/Chat/Me(${ANA})/Avatar`, sAna, sAvatarJpeg, { 'Content-Type': 'image/jpeg' })));
    const iAfter = (await http('GET', `/service/Chat/Me(${ANA})?$select=AvatarVersion`, sAna)).body.AvatarVersion;
    check('dois avatares simultaneos somam +2 (incremento atomico)', iAfter === iBefore + 2, { iBefore, iAfter });
}

async function pdfThumbnailChecks(sAna) {
    const sAnaMt = await mediaTokenOf('ana@resenha.dev');
    const sPdf = Buffer.from('%PDF-1.4 previa de teste');
    const sThumb = await sharp({ create: { width: 64, height: 90, channels: 3, background: '#fff' } }).jpeg().toBuffer();

    const oPdf = await createUpload(sAna, { Conversation_ID: GERAL, Kind: 'File', MimeType: 'application/pdf', FileName: 'previa.pdf', Size: sPdf.length });
    check('PDF: upload criado', !!oPdf.body.ID, oPdf.body);
    check('PDF: PUT Content = 204', (await raw('PUT', `/service/Chat/Uploads(${oPdf.body.ID})/Content`, sAna, sPdf, { 'Content-Type': 'application/pdf' })).status === 204);
    check('PDF: PUT Thumbnail (primeira pagina) = 204', (await raw('PUT', `/service/Chat/Uploads(${oPdf.body.ID})/Thumbnail`, sAna, sThumb, { 'Content-Type': 'image/jpeg' })).status === 204);

    const oSent = await sendUpload(sAna, { Conversation_ID: GERAL, Text: 'Veja o PDF', Upload_ID: oPdf.body.ID });
    const oExpanded = await http('GET', `/service/Chat/Messages?$filter=ID eq ${oSent.body.ID}&$expand=Attachment`, sAna);
    const sAttachmentId = oExpanded.body.value?.[0]?.Attachment?.ID;
    check('PDF: anexo expandido', !!sAttachmentId, oExpanded.body);

    const oThumb = await raw('GET', `/service/Chat/Attachments(${sAttachmentId})/Thumbnail?mt=${sAnaMt}`);
    check('PDF: GET Thumbnail = 200 image/webp inline', oThumb.status === 200 && oThumb.headers.get('content-type') === 'image/webp' && oThumb.headers.get('content-disposition') === 'inline', oThumb.headers.get('content-disposition'));

    const oContent = await raw('GET', `/service/Chat/Attachments(${sAttachmentId})/Content?mt=${sAnaMt}`);
    check('PDF: Content continua attachment octet-stream', oContent.status === 200 && oContent.headers.get('content-type') === 'application/octet-stream' && oContent.headers.get('content-disposition').startsWith('attachment'), oContent.headers.get('content-disposition'));

    const oTxt = await createUpload(sAna, { Conversation_ID: GERAL, Kind: 'File', MimeType: 'text/plain', FileName: 'nota.txt', Size: 5 });
    await raw('PUT', `/service/Chat/Uploads(${oTxt.body.ID})/Content`, sAna, Buffer.from('nota!'), { 'Content-Type': 'text/plain' });
    check('.txt com miniatura = 400 thumbnailNotAllowed', (await raw('PUT', `/service/Chat/Uploads(${oTxt.body.ID})/Thumbnail`, sAna, sThumb, { 'Content-Type': 'image/jpeg' })).status === 400);
}

(async () => {
    const sDavi = await login('davi');
    const sAna = await login('ana@resenha.dev');
    const sJoao = await login('joao');

    check('sem token = 401', (await http('GET', '/service/Chat/Conversations')).status === 401);
    check('token invalido = 401', (await http('GET', '/service/Chat/Conversations', 'x')).status === 401);

    const oDavi = await http('GET', '/service/Chat/Conversations?$select=ID,Name,UnreadCount&$orderby=Name', sDavi);
    check('davi ve Geral, Projeto X, Direct com ana, Avisos e Off-topic', oDavi.body.value.length === 5, oDavi.body);
    check('UnreadCount davi/Geral = 2', find(oDavi.body.value, GERAL)?.UnreadCount === 2, oDavi.body);

    const oAna = await http('GET', '/service/Chat/Conversations?$select=ID,UnreadCount', sAna);
    check('UnreadCount ana/Geral = 4', find(oAna.body.value, GERAL)?.UnreadCount === 4, oAna.body);

    const oJoao = await http('GET', '/service/Chat/Conversations?$select=ID,Name', sJoao);
    check('joao so ve Geral', oJoao.body.value.length === 1 && oJoao.body.value[0].ID === GERAL, oJoao.body);
    check('joao nao le o grupo por chave', (await http('GET', `/service/Chat/Conversations(${PROJETO})`, sJoao)).status === 404);
    const oJoaoMsgs = await http('GET', `/service/Chat/Messages?$filter=Conversation_ID eq ${PROJETO}`, sJoao);
    check('joao nao le mensagens do grupo', oJoaoMsgs.body.value.length === 0, oJoaoMsgs.body);
    const oJoaoAll = await http('GET', '/service/Chat/Messages', sJoao);
    check('joao so ve mensagens do Geral', oJoaoAll.body.value.length === 6, oJoaoAll.body.value.length);
    const oJoaoExpand = await http('GET', '/service/Chat/Conversations?$expand=Messages', sJoao);
    check('expand Messages so do Geral', oJoaoExpand.body.value.length === 1 && oJoaoExpand.body.value[0].Messages.length === 6, oJoaoExpand.body);
    const oJoaoMembers = await http('GET', `/service/Chat/Members?$filter=Conversation_ID eq ${PROJETO}`, sJoao);
    check('joao nao ve membros do grupo', oJoaoMembers.body.value.length === 0, oJoaoMembers.body);
    const oSend = await http('POST', '/service/Chat/SendMessage', sJoao, { Conversation_ID: PROJETO, Text: 'invasao' });
    check('joao nao envia no grupo (403)', oSend.status === 403, oSend);

    const oSender = await http('GET', '/service/Chat/Messages?$expand=Sender&$top=1', sDavi);
    const oSenderRow = oSender.body.value[0].Sender;
    check('Sender nao vaza Email/PasswordHash', !!oSenderRow && !('Email' in oSenderRow) && !('PasswordHash' in oSenderRow), oSender.body);
    check('Users nao exposto', (await http('GET', '/service/Chat/Users', sDavi)).status === 404);
    const oPeople = await http('GET', '/service/Chat/People', sDavi);
    check('People sem Email', oPeople.status === 200 && !('Email' in oPeople.body.value[0]), oPeople.body);
    const oMe = await http('GET', '/service/Chat/Me', sAna);
    check('Me so a propria linha', oMe.body.value.length === 1 && oMe.body.value[0].Username === 'ana', oMe.body);
    const oPatch = await http('PATCH', `/service/Chat/Me(${DAVI})`, sAna, { About: 'hack' });
    check('ana nao edita o davi', oPatch.status >= 400, oPatch);
    const oEdit = await http('PATCH', `/service/Chat/Me(${ANA})`, sAna, { About: 'Editado' });
    check('ana edita o proprio perfil', oEdit.status === 200 && oEdit.body.About === 'Editado', oEdit);
    const oBlank = await http('PATCH', `/service/Chat/Me(${ANA})`, sAna, { DisplayName: '  ' });
    check('DisplayName vazio rejeitado', oBlank.status === 400, oBlank);
    const oSettings = await http('PATCH', `/service/Chat/MySettings(User_ID=${ANA})`, sAna, { Theme: 'Dark' });
    check('ana edita as proprias settings', oSettings.status === 200 && oSettings.body.Theme === 'Dark', oSettings);
    const oOthers = await http('PATCH', `/service/Chat/MySettings(User_ID=${DAVI})`, sAna, { Theme: 'Dark' });
    check('ana nao edita settings do davi', oOthers.status >= 400, oOthers);
    const oWriteMsg = await http('POST', '/service/Chat/Messages', sAna, { Conversation_ID: GERAL, Text: 'x' });
    check('Messages readonly', oWriteMsg.status >= 400, oWriteMsg.status);
    const oMemberPatch = await http('PATCH', '/service/Chat/Members(c0000000-0000-4000-8000-000000000002)', sAna, { IsPinned: true, Role: 'Owner' });
    check('ana fixa a propria conversa sem mudar Role', oMemberPatch.status === 200 && oMemberPatch.body.IsPinned === true && oMemberPatch.body.Role === 'Member', oMemberPatch);
    const oMemberOther = await http('PATCH', '/service/Chat/Members(c0000000-0000-4000-8000-000000000001)', sAna, { IsPinned: true });
    check('ana nao altera membro alheio', oMemberOther.status >= 400, oMemberOther);

    const oAnaWs = await connect(sAna);
    const oJoaoWs = await connect(sJoao);

    await wait(300);
    check('ws recebe presence.snapshot', oAnaWs.events[0]?.type === 'presence.snapshot', oAnaWs.events);
    check('ws sem token e rejeitado', await connect('x').then(() => false, () => true));

    oJoaoWs.socket.send(JSON.stringify({ type: 'typing', payload: { ConversationId: GERAL } }));
    oAnaWs.socket.send(JSON.stringify({ type: 'ping', payload: {} }));
    await wait(400);
    check('ana recebe typing do joao', oAnaWs.events.some((o) => o.type === 'typing' && o.payload.UserId === JOAO), oAnaWs.events);
    check('joao nao recebe o proprio typing', !oJoaoWs.events.some((o) => o.type === 'typing'), oJoaoWs.events);
    check('ping gera pong', oAnaWs.events.some((o) => o.type === 'pong'), oAnaWs.events);
    oJoaoWs.socket.send(JSON.stringify({ type: 'typing', payload: { ConversationId: PROJETO } }));
    await wait(300);
    check('typing em conversa alheia e ignorado', oAnaWs.events.filter((o) => o.type === 'typing').length === 1, oAnaWs.events);

    const oOnline = await http('GET', '/service/Chat/People?$select=ID,IsOnline', sDavi);
    check('People.IsOnline via hub', find(oOnline.body.value, ANA)?.IsOnline === true && find(oOnline.body.value, DAVI)?.IsOnline === false, oOnline.body);

    const oDaviWs = await connect(sDavi);

    await wait(300);
    check('presence.changed online do davi', oAnaWs.events.some((o) => o.type === 'presence.changed' && o.payload.IsOnline && o.payload.UserId === DAVI), oAnaWs.events);

    const oSent = await http('POST', '/service/Chat/SendMessage', sDavi, { Conversation_ID: GERAL, Text: '  Mensagem em tempo real  ' });
    check('SendMessage com Text trim', oSent.status < 300 && oSent.body.Text === 'Mensagem em tempo real', oSent);
    await wait(400);
    const oCreated = oAnaWs.events.find((o) => o.type === 'message.created');
    check('ana recebe message.created', oCreated?.payload.MessageId === oSent.body.ID && oCreated.payload.SenderId === DAVI, oAnaWs.events);
    check('joao recebe message.created', oJoaoWs.events.some((o) => o.type === 'message.created'));

    const oAfter = await http('GET', '/service/Chat/Conversations?$select=ID,UnreadCount,LastMessage', sDavi);
    check('davi 0 nao lidas e LastMessage atualizada', find(oAfter.body.value, GERAL)?.UnreadCount === 0 && find(oAfter.body.value, GERAL)?.LastMessage === 'Mensagem em tempo real', oAfter.body);
    const oAnaAfter = await http('GET', '/service/Chat/Conversations?$select=ID,UnreadCount', sAna);
    check('ana 5 nao lidas', find(oAnaAfter.body.value, GERAL)?.UnreadCount === 5, oAnaAfter.body);

    const oRead = await http('POST', '/service/Chat/MarkAsRead', sAna, { Conversation_ID: GERAL });
    check('MarkAsRead 204', oRead.status === 204, oRead);
    await wait(300);
    check('conversation.read publicado', oJoaoWs.events.some((o) => o.type === 'conversation.read' && o.payload.UserId === ANA), oJoaoWs.events);
    const oAnaRead = await http('GET', '/service/Chat/Conversations?$select=ID,UnreadCount', sAna);
    check('ana 0 nao lidas apos MarkAsRead', find(oAnaRead.body.value, GERAL)?.UnreadCount === 0, oAnaRead.body);
    check('MarkAsRead em grupo alheio = 403', (await http('POST', '/service/Chat/MarkAsRead', sJoao, { Conversation_ID: PROJETO })).status === 403);
    check('SendMessage vazio = 400', (await http('POST', '/service/Chat/SendMessage', sDavi, { Conversation_ID: GERAL, Text: '   ' })).status === 400);

    oDaviWs.socket.close();
    await wait(500);
    check('presence.changed offline com LastSeenAt', oAnaWs.events.some((o) => o.type === 'presence.changed' && !o.payload.IsOnline && o.payload.LastSeenAt), oAnaWs.events);
    const oSeen = await http('GET', '/service/Chat/People?$select=ID,LastSeenAt', sAna);
    check('LastSeenAt gravado', !!find(oSeen.body.value, DAVI)?.LastSeenAt, oSeen.body);

    const readAs = (sToken, sLocale, sPath) => fetch(`http://${HOST}${sPath}`, {
        headers: { Authorization: `Bearer ${sToken}`, 'Accept-Language': sLocale }
    }).then((oResponse) => oResponse.json());
    const oLocaleGroup = await http('POST', '/service/Chat/CreateConversation', sDavi, { Kind: 'Group', Name: 'Idioma', MemberIds: [ANA] });
    const sLocaleGroup = oLocaleGroup.body.ID;
    const sCreatedEn = 'Davi Castro created the group "Idioma"';
    const sCreatedPt = 'Davi Castro criou o grupo "Idioma"';
    const oMessagesPath = `/service/Chat/Messages?$filter=Conversation_ID eq ${sLocaleGroup}&$orderby=createdAt`;

    check('aviso do sistema em ingles com Accept-Language en', (await readAs(sDavi, 'en', oMessagesPath)).value[0]?.Text === sCreatedEn);
    check('aviso do sistema em portugues com pt-BR', (await readAs(sDavi, 'pt-BR', oMessagesPath)).value[0]?.Text === sCreatedPt);
    check('aviso sem $select de Kind ainda traduz', (await readAs(sDavi, 'en', `/service/Chat/Messages?$filter=Conversation_ID eq ${sLocaleGroup}&$select=ID,Text&$orderby=createdAt`)).value[0]?.Text === sCreatedEn);
    check('LastMessage do grupo traduzido em ingles', (await readAs(sDavi, 'en', `/service/Chat/Conversations(${sLocaleGroup})`)).LastMessage === sCreatedEn);
    const oEnMembers = await readAs(sAna, 'en', `/service/Chat/Members?$filter=User_ID eq ${ANA} and Conversation_ID eq ${sLocaleGroup}&$expand=Conversation`);
    check('Members com $expand=Conversation traz LastMessage em ingles', oEnMembers.value?.[0]?.Conversation?.LastMessage === sCreatedEn, oEnMembers);
    await http('POST', '/service/Chat/SendMessage', sDavi, { Conversation_ID: sLocaleGroup, Text: 'Oi pessoal' });
    check('mensagem normal: LastMessage sem traducao', (await readAs(sDavi, 'en', `/service/Chat/Conversations(${sLocaleGroup})`)).LastMessage === 'Oi pessoal');
    const sMetadata = await fetch(`http://${HOST}/service/Chat/$metadata`).then((oResponse) => oResponse.text());
    check('chaves de traducao nao expostas no $metadata', !/SystemKey|SystemArgs|LastMessageKey|LastMessageArgs/.test(sMetadata));

    const oReg = await http('POST', '/auth/register', null, { Email: 'Maria@Resenha.dev', Password: '123456', DisplayName: 'Maria', Username: 'maria' });
    check('register 201', oReg.status === 201 && oReg.body.User.Username === 'maria' && !!oReg.body.AccessToken, oReg);
    check('register e-mail duplicado 409', (await http('POST', '/auth/register', null, { Email: 'maria@resenha.dev', Password: '123456', DisplayName: 'M', Username: 'maria2' })).status === 409);
    check('register usuario duplicado 409', (await http('POST', '/auth/register', null, { Email: 'm2@resenha.dev', Password: '123456', DisplayName: 'M', Username: 'maria' })).status === 409);
    check('register senha curta 400', (await http('POST', '/auth/register', null, { Email: 'm3@resenha.dev', Password: '123', DisplayName: 'M', Username: 'maria3' })).status === 400);
    check('register usuario invalido 400', (await http('POST', '/auth/register', null, { Email: 'm3@resenha.dev', Password: '123456', DisplayName: 'M', Username: 'A B' })).status === 400);
    const oMariaConv = await http('GET', '/service/Chat/Conversations?$select=ID,Name,UnreadCount', oReg.body.AccessToken);
    check('maria entrou no Geral', oMariaConv.body.value.length === 1 && oMariaConv.body.value[0].ID === GERAL, oMariaConv.body);
    const oBad = await http('POST', '/auth/login', null, { Login: 'davi', Password: 'errada' });
    check('login errado 401 generico', oBad.status === 401 && !!oBad.body.error.message, oBad);
    check('login com username', (await http('POST', '/auth/login', null, { Login: 'maria', Password: '123456' })).status === 200);

    const oLogin = await http('POST', '/auth/login', null, { Login: 'davi', Password: '123456' });
    const oRefresh = await http('POST', '/auth/refresh', null, { RefreshToken: oLogin.body.RefreshToken });
    check('refresh rotaciona', oRefresh.status === 200 && oRefresh.body.RefreshToken !== oLogin.body.RefreshToken, oRefresh);
    check('refresh antigo revogado 401', (await http('POST', '/auth/refresh', null, { RefreshToken: oLogin.body.RefreshToken })).status === 401);
    check('logout 204', (await http('POST', '/auth/logout', null, { RefreshToken: oRefresh.body.RefreshToken })).status === 204);
    check('refresh apos logout 401', (await http('POST', '/auth/refresh', null, { RefreshToken: oRefresh.body.RefreshToken })).status === 401);

    await mediaChecks(sDavi, sAna, sJoao, oAnaWs);
    await securityChecks(sDavi, sAna, sJoao);
    await pdfThumbnailChecks(sAna);
    oAnaWs.socket.close();
    oJoaoWs.socket.close();
    process.exit(process.exitCode || 0);
})().catch((oError) => { console.error(oError); process.exit(1); });
