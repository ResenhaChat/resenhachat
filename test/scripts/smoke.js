/* Teste de fumaca. Suba o servidor (npx cds-tsx serve all --port 4004) e rode: node test/scripts/smoke.js */
const WebSocket = require('ws');

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

    oAnaWs.socket.close();
    oJoaoWs.socket.close();
    process.exit(process.exitCode || 0);
})().catch((oError) => { console.error(oError); process.exit(1); });
