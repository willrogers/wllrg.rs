<?php 
	$topdir = "../";
	
	//mail script - do not edit
	$to = "Elizabeth Tidy <liz@elizabethtidy.co.uk>";
	$subject = "Web form response from ".$_POST['name'];
	$headers = 'From: '.$_POST['name'].'<'.$_POST['email'].'>';

	//generate the message
	$message = 			
$_POST['name'].' sent you an e-mail via the web contact form at http://elizabethtidy.co.uk/contact/

';

	if(isset($_POST['email']))
	{$message .= 'You can e-mail them at '.$_POST['email'].' , or by simply hitting "reply" to this e-mail.

';	}
	else
	{
		//redirect
	}

	if(isset($_POST['phone']))
	{$message .= 'They left their \'phone number, '.$_POST['phone'].'

';	}
	else
	{$message .= 'They didn\'t leave a contact number.

';	}

	if(isset($_POST['message']))
	{$message .= 'Their message says:

'.$_POST['message'].'

';	}
	else
	{
		//redirect
	}

	//send it
	if(!mail($to, $subject, $message, $headers))
	{
		$mailerr = TRUE;
	}
	
	include($topdir."shared/top.php"); ?>
	<title>Send e-mail | elizabethtidy.co.uk</title>
	
	<meta name="description" content="Get in touch with Elizabeth Tidy." />
	<meta name="keywords" content="e-mail, email, phone, telephone, address" />

<?php include($topdir."shared/middle.php"); ?>
	
		<?php //if the mail sent successfully
		if(!$mailerr)
		{?>
		
		<h1>Message sent</h1>
		<p>Your e-mail was sent successfully. Thanks for getting in touch!</p>
		
		<h2>What you sent</h2>
		
		<p>Please have a quick look over the details you sent us to make sure they&rsquo;re correct. If they&rsquo; not, <a href="/contact/#form">drop us a line</a>!</p>
		<table>
			<tr>
				<th>Name</th>
				<td><?php print $_POST['name']; ?></td>
			</tr>
			<tr>
				<th>E-mail</th>
				<td><?php print $_POST['email']; ?></td>
			</tr>
			<tr>
				<th>&rsquo;Phone</th>
				<td><?php print $_POST['phone']; ?></td>
			</tr>
			<tr>
				<th>Message</th>
				<td><?php print $_POST['message']; ?></td>
			</tr>
		</table>
		<?php }
		//there was an error
		else
		{?>
		<h1>Error</h1>
		
		<p>Sorry: there was an error sending your message—please <a href="/contact/#form">send it again</a>!</p>
		
		<?php
		} 

include($topdir."shared/bottom.php"); ?>