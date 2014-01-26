<?php 
	$topdir = "../";
	include($topdir."shared/top.php"); ?>
	<title>Art | elizabethtidy.co.uk</title>
	
	<meta name="description" content="Gallery of art work - Elizabeth Tidy" />
	<meta name="keywords" content="painting. oil painting, Elizabeth Tidy, Liz Tidy" />

	<script type="text/javascript">
	// http://www.maratz.com/blog/archives/2006/06/07/preload-images-with-javascript/
		var preloaded = new Array();
		function preload_images()
		{
			for (var i = 0; i < arguments.length; i++)
			{
				preloaded[i] = document.createElement('img');
				preloaded[i].setAttribute('src',arguments[i]);
			};
		};
		preload_images(
			'owlhover.jpg',
			'davidhover.jpg',
			'aberdyfihover.jpg',
			'triptychhover.jpg',
			'cowleyroadhover.jpg',
			'blueboarhover.jpg',
			'memoryboxeshover.jpg',
			'skyscapemuralhover.jpg'
			'minihover.jpg'
		);
	</script>    
 
	
	<style type="text/css">
		#pics a.owl:link, #pics a.owl:visited {
			background: #000000 url(owlbg.jpg) center center no-repeat;
		}
		#pics a.owl:hover {
			background: #000000 url(owlhover.jpg) center center no-repeat;
		}
		#pics a.david:link, #pics a.david:visited {
			background: #000000 url(davidbg.jpg) center center no-repeat;
		}
		
		#pics a.david:hover {
			background: #000000 url(davidhover.jpg) center center no-repeat;
		}
		
		#pics a.aberdyfi:link, #pics a.aberdyfi:visited {
			background: #000000 url(aberdyfibg.jpg) top left no-repeat;
		}
		
		#pics a.aberdyfi:hover {
			background: #000000 url(aberdyfihover.jpg) top left no-repeat;
		}
		
		#pics a.triptych:link, #pics a.triptych:visited {
			background: #000000 url(triptychbg.jpg) center center no-repeat;
		}
		
		#pics a.triptych:hover {
			background: #000000 url(triptychhover.jpg) center center no-repeat;
		}
			
		#pics a.cowleyroad:link, #pics a.cowleyroad:visited {
			background: #000000 url(cowleyroadbg.jpg) center center no-repeat;
		}
		
		#pics a.cowleyroad:hover {
			background: #000000 url(cowleyroadhover.jpg) center center no-repeat;
		}
		#pics a.blueboar:link, #pics a.blueboar:visited {
			background: #000000 url(blueboarbg.jpg) center center no-repeat;
		}
		
		#pics a.blueboar:hover {
			background: #000000 url(blueboarhover.jpg) center center no-repeat;
		}
		
		#pics a.memoryboxes:link, #pics a.memoryboxes:visited {
			background: #000000 url(memoryboxesbg.jpg) center center no-repeat;
		}
		
		#pics a.memoryboxes:hover {
			background: #000000 url(memoryboxeshover.jpg) center center no-repeat;
		}
		
		#pics a.skyscapemural:link, #pics a.skyscapemural:visited {
			background: #000000 url(skyscapemuralbg.jpg) center center no-repeat;
		}
		
		#pics a.skyscapemural:hover {
			background: #000000 url(skyscapemuralhover.jpg) center center no-repeat;
		}
		
		#pics a.mini:link, #pics a.mini:visited {
			background: #000000 url(minibg.jpg) center center no-repeat;
		}
		
		#pics a.mini:hover {
			background: #000000 url(minihover.jpg) center center no-repeat;
		}
	

	</style>

<?php include($topdir."shared/middle.php"); ?>
	
		<h1>Art</h1>
		<p>The gallery contains some examples of my recent work. Click on an image to see the full painting and learn more about it.</p>
		
		<div id="pics">
			<a href="owl/" class="owl">owl</a>
			<a href="david/" class="david">David</a>
			<a href="aberdyfi/" class="aberdyfi">Aberdyfi harbour</a>
			<a href="triptych/" class="triptych">triptych</a>
			<a href="cowleyroad/" class="cowleyroad">Cowley Road</a>
			<a href="blueboar/" class="blueboar">Blue Boar</a>
			<a href="memoryboxes/" class="memoryboxes">Memory boxes</a>
			<a href="skyscapemural/" class="skyscapemural">Skyscape mural</a>
			<a href="mini/" class="mini">Mini</a>
		</div>
<?php include($topdir."shared/bottom.php"); ?>
