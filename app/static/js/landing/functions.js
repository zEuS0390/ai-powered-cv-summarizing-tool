export async function updateContactLinks() {

  const contactsWeChatLink = document.querySelector("#contacts_wechat_link");
  const contactsPhoneLink = document.querySelector("#contacts_phone_link");
  const contactsWhatsAppLink = document.querySelector("#contacts_whatsapp_link");
  const contactsEmailLink = document.querySelector("#contacts_email_link");
  const contactsLinkedInLink = document.querySelector("#contacts_linkedin_link");

  const getContactsTask = await getContacts();

  // Set an interval to update modal with user details
  const intervalID = setInterval(async () => {
    const formData = new FormData();
    formData.append("task_id", getContactsTask.task_id);
    await fetch("/getContactsTask", {
      method: "POST",
      body: formData
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    }).then((responseData) => {

      if (responseData.task_status == "SUCCESS") {
        clearInterval(intervalID);

        const contactsWeChat = responseData.contacts.contacts_wechat;
        const contactsPhone = responseData.contacts.contacts_phone;
        const contactsWhatsApp = responseData.contacts.contacts_whatsapp;
        const contactsEmail = responseData.contacts.contacts_email;
        const contactsLinkedIn = responseData.contacts.contacts_linkedin;

        contactsWeChatLink.setAttribute("href", contactsWeChat ? contactsWeChat : '#');
        contactsPhoneLink.setAttribute("href", contactsPhone ? "tel:"+contactsPhone : '#');
        contactsWhatsAppLink.setAttribute("href", contactsWhatsApp ? contactsWhatsApp : '#');
        contactsEmailLink.setAttribute("href", contactsEmail ? "mailto:"+contactsEmail : '#');
        contactsLinkedInLink.setAttribute("href", contactsLinkedIn ? contactsLinkedIn : '#');

      }

    });
  }, 500);

}

export async function getContacts() {
  const response = await fetch("/getContacts", {
    method: "GET"
  })
  .then((response) => {
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response);
  }).catch((error) => {
    console.log(error);
  });
  return response;
}