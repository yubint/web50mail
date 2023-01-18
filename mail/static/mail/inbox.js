document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  document.querySelector('#compose-form').addEventListener('submit', event => {
    send_email(event);
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(recipient = '', subject = '', body = '') {

  // Show compose view and hide other views
  document.querySelector('#mailbox-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipient;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#mailbox-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#mailbox-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      let emailView = document.querySelector('#mailbox-view');
      emails.forEach(email => {
        const emailDiv = document.createElement('div');
        const senderDiv = document.createElement('div');
        const subjectDiv = document.createElement('div');
        const dateDiv = document.createElement('div');
        senderDiv.setAttribute('id', `${email.id}-sender`);
        senderDiv.setAttribute('class', 'sender-div bold');
        subjectDiv.setAttribute('id', `${email.id}-subject`);
        subjectDiv.setAttribute('class', 'subject-div');
        dateDiv.setAttribute('id', `${email.id}-date`);
        dateDiv.setAttribute('class', 'date');
        senderDiv.innerHTML = `${email.sender}`;
        subjectDiv.innerHTML = `${email.subject}`;
        dateDiv.innerHTML = `${email.timestamp}`;
        emailDiv.setAttribute('class', 'email-div');
        emailDiv.setAttribute('data-read', `${email.read}`)
        emailDiv.append(senderDiv, subjectDiv, dateDiv);
        emailView.append(emailDiv);

        // adding onclick for handling click on the emaildiv
        emailDiv.addEventListener('click', () => {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              read: true
            })
          })
            .then(response => {
              emailDiv.dataset.read = 'true';
            })
            .catch(err => console.log(err))

          load_email(email.id);
        })

      });
    })
    .catch(err => {
      console.log(err);
    })

}


function send_email(event) {
  event.preventDefault();
  console.log('hello')
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => {
      console.log(result.message);
    })
    .catch(err => {
      console.log(err.error);
    })

  load_mailbox('sent');
}

function load_email(id) {
  document.querySelector('#mailbox-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#email-view').style.display = 'block';

  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      document.querySelector('#from').innerHTML = email.sender;

      let allRecipients = '';
      email.recipients.forEach(recipient => {
        allRecipients += `${recipient},`
      })
      document.querySelector('#to').innerHTML = allRecipients;

      document.querySelector('#subject').innerHTML = email.subject;
      document.querySelector('#timestamp').innerHTML = email.timestamp;
      document.querySelector('#email-body').innerHTML = email.body;

      const userEmail = document.querySelector('#user-email').innerHTML;
      const archiveButton = document.querySelector('#archive');
      const replyButton = document.querySelector('#reply');
      const unarchiveButton = document.querySelector('#unarchive');

      // checking if user and sender is same. As if user is the sender then there is no need of archive or reply button 
      if (userEmail === email.sender) {
        document.querySelector('.buttons').style.display = 'none';
      }
      else {
        document.querySelector('.buttons').style.display = 'block';
        if (email.archived) {
          archiveButton.style.display = 'none';
          unarchiveButton.style.display = 'inline';
        }
        else {
          unarchiveButton.style.display = 'none';
          archiveButton.style.display = 'inline';
        }

        archiveButton.addEventListener('click', () => {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true
            })
          })
            .then(response => {

              archiveButton.style.display = 'none';
              unarchiveButton.style.display = 'inline';
            })

        })

        unarchiveButton.addEventListener('click', () => {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false
            })
          })
            .then(response => {

              unarchiveButton.style.display = 'none';
              archiveButton.style.display = 'inline';
            })

        })

        replyButton.addEventListener('click', () => {
          // checking for Re: in subject and adding it if it doesn't have it in the reply 
          subject = email.subject.includes('Re:') ? email.subject : `Re: ${email.subject}`;
          body = `On ${email.timestamp} ${email.sender} wrote: \n"${email.body}" \n\n `;

          compose_email(recipient = email.sender, subject = subject, body = body);
        })
      }
    })

}