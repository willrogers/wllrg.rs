<?php 
	$topdir = "../";
	include($topdir."shared/top.php");
	include($topdir.'shared/bad-behavior/bad-behavior-generic.php')
	?>
	<title>Contact Elizabeth Tidy | elizabethtidy.co.uk</title>
	
	<meta name="description" content="Contact Elizabeth Tidy." />
	<meta name="keywords" content="e-mail, email, phone, telephone, address, facebook, elizabeth, liz, tidy" />

<?php include($topdir."shared/middle.php"); ?>
	
		<h1>Contact</h1>
		<p>Feel free to get in touch using the following contact details, or the e-mail form at the bottom of the page!</p>
		<table>
			<tr>
				<th>Telephone:</th>
				<td>07751 252907</td>
			</tr>

			<tr>
				<th>E-mail:</th>
				<td>
<script type="text/javascript" language="javascript">
<!--
// eMail Obfuscator Script 2.1 by Tim Williams - freeware
{
	coded = "DGU@KDGUONK0H0GLV.MA.ZE"
		cipher = "aZbYcXdWeVfUgThSiRjQkPlOmNnMoLpKqJrIsHtGuFvEwDxCyBzA1234567890"
		shift=coded.length
		link=""
		for (i=0; i<coded.length; i++){
			if (cipher.indexOf(coded.charAt(i))==-1){
				ltr=coded.charAt(i)
				link+=(ltr)
			}
			else {     
				ltr = (cipher.indexOf(coded.charAt(i))-shift+cipher.length) % cipher.length
				link+=(cipher.charAt(ltr))
			}				
	}
			document.write("<a href='mailto:"+link+"'>"+link+"</a>")
	}
//-->
</script>
<noscript>
liz at this domain dot co dot uk
</noscript>
</td>
			</tr>
			<tr>
				<th>Facebook:</th>
				<td><a href="http://www.facebook.com/p/Elizabeth_Tidy/36912204">Elizabeth Tidy</a></td>
			</tr>
		</table>
		
		<h2 id="form">Web contact form</h2>
		
		<form action="/send/" method="post" enctype="multipart/form-data">
			<div class="required">
				<label for="name">Your name:</label>
				<input name="name" id="name" size="10" maxlength="100" value="" type="text" />
			</div>

			<div class="required">
				<label for="email">Your e-mail:</label>
				<input name="email" id="email" size="10" maxlength="100" value="" type="text" />
			</div>
			
			<div class="required">
				<label for="phone">Your phone number:</label>
				<input name="phone" id="phone" size="10" maxlength="100" value="" type="text" />
			</div>

			<div class="required">
				<label for="message">Your message:</label>
				<textarea name="message" id="message" rows="10" cols="21"></textarea>
			</div>

			<div class="submit">
				<input type="submit" value="Send &raquo;"/>
			</div>
		</form>
<?php include($topdir."shared/bottom.php"); ?>
