/* Script do Gmail para o botão "Leads Mail" do CRM (script.google.com, conta geral.rlphoto@gmail.com).
   Só lê: devolve os pedidos do Casamentos.pt dos últimos 30 dias e não altera nenhum email.
   A app trata de ignorar as leads que já existem. */

function doGet() {
  var emails = []
  GmailApp.search('from:casamentos.pt subject:"Pedido de informação" newer_than:30d', 0, 100).forEach(function (conversa) {
    conversa.getMessages().forEach(function (m) {
      if (m.getFrom().indexOf('casamentos.pt') === -1) return
      emails.push({ data: m.getDate().toISOString(), texto: m.getPlainBody() })
    })
  })
  return ContentService.createTextOutput(JSON.stringify({ emails: emails })).setMimeType(ContentService.MimeType.JSON)
}
