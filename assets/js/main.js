
(function($) {

	var	$window = $(window),
		$body = $('body'),
		$header = $('#header'),
		$all = $body.add($header);

	// Breakpoints.
		breakpoints({
			xxlarge: [ '1681px',  '1920px' ],
			xlarge:  [ '1281px',  '1680px' ],
			large:   [ '1001px',  '1280px' ],
			medium:  [ '737px',   '1000px' ],
			small:   [ '481px',   '736px'  ],
			xsmall:  [ null,      '480px'  ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Touch mode.
		if (browser.mobile)
			$body.addClass('is-touch');
		else {

			breakpoints.on('<=small', function() {
				$body.addClass('is-touch');
			});

			breakpoints.on('>small', function() {
				$body.removeClass('is-touch');
			});

		}

	// Fix: IE flexbox fix.
		if (browser.name == 'ie') {

			var $main = $('.main.fullscreen'),
				IEResizeTimeout;

			$window
				.on('resize.ie-flexbox-fix', function() {

					clearTimeout(IEResizeTimeout);

					IEResizeTimeout = setTimeout(function() {

						var wh = $window.height();

						$main.each(function() {

							var $this = $(this);

							$this.css('height', '');

							if ($this.height() <= wh)
								$this.css('height', (wh - 50) + 'px');

						});

					});

				})
				.triggerHandler('resize.ie-flexbox-fix');

		}

	// Gallery.
		$window.on('load', function() {

			var $gallery = $('.gallery');

			// $gallery.poptrox({
			// 	baseZIndex: 10001,
			// 	useBodyOverflow: false,
			// 	usePopupEasyClose: false,
			// 	overlayColor: '#1f2328',
			// 	overlayOpacity: 0.65,
			// 	usePopupDefaultStyling: false,
			// 	usePopupCaption: true,
			// 	popupLoaderText: '',
			// 	windowMargin: 50,
			// 	usePopupNav: true
			// });

			// Hack: Adjust margins when 'small' activates.
				breakpoints.on('>small', function() {
					$gallery.each(function() {
							if ($(this)[0] && $(this)[0]._poptrox) $(this)[0]._poptrox.windowMargin = 50;
						});
				});

				breakpoints.on('<=small', function() {
					$gallery.each(function() {
							if ($(this)[0] && $(this)[0]._poptrox) $(this)[0]._poptrox.windowMargin = 5;
						});
				});

		});

	// Section transitions.
		if (browser.canUse('transition')) {

			var on = function() {

				// Galleries.
					$('.gallery')
						.scrollex({
							top:		'30vh',
							bottom:		'30vh',
							delay:		50,
							initialize:	function() { $(this).addClass('inactive'); },
							terminate:	function() { $(this).removeClass('inactive'); },
							enter:		function() { $(this).removeClass('inactive'); },
							leave:		function() { $(this).addClass('inactive'); }
						});

				// Generic sections.
					$('.main.style1')
						.scrollex({
							mode:		'middle',
							delay:		100,
							initialize:	function() { $(this).addClass('inactive'); },
							terminate:	function() { $(this).removeClass('inactive'); },
							enter:		function() { $(this).removeClass('inactive'); },
							leave:		function() { $(this).addClass('inactive'); }
						});

					$('.main.style2')
						.scrollex({
							mode:		'middle',
							delay:		100,
							initialize:	function() { $(this).addClass('inactive'); },
							terminate:	function() { $(this).removeClass('inactive'); },
							enter:		function() { $(this).removeClass('inactive'); },
							leave:		function() { $(this).addClass('inactive'); }
						});

				// Contact.
					$('#contact')
						.scrollex({
							top:		'50%',
							delay:		50,
							initialize:	function() { $(this).addClass('inactive'); },
							terminate:	function() { $(this).removeClass('inactive'); },
							enter:		function() { $(this).removeClass('inactive'); },
							leave:		function() { $(this).addClass('inactive'); }
						});

			};

			var off = function() {

				// Galleries.
					$('.gallery')
						.unscrollex();

				// Generic sections.
					$('.main.style1')
						.unscrollex();

					$('.main.style2')
						.unscrollex();

				// Contact.
					$('#contact')
						.unscrollex();

			};

			breakpoints.on('<=small', off);
			breakpoints.on('>small', on);

		}

	// Events.
		var resizeTimeout, resizeScrollTimeout;

		$window
			.on('resize', function() {

				// Disable animations/transitions.
					$body.addClass('is-resizing');

				clearTimeout(resizeTimeout);

				resizeTimeout = setTimeout(function() {

					// Update scrolly links.
						$('a[href^="#"]').scrolly({
							speed: 1500,
							offset: $header.outerHeight() - 1
						});

					// Re-enable animations/transitions.
						setTimeout(function() {
							$body.removeClass('is-resizing');
							$window.trigger('scroll');
						}, 0);

				}, 100);

			})
			.on('load', function() {
				$window.trigger('resize');
			});

})(jQuery);

// Removed image overlay/zoom handlers so image clicks follow their anchor links.

// Include loader: inject shared header/footer from /assets/includes/*.html
(function() {
	function injectHtml(target, html) {
		if (!target) return;
		target.innerHTML = html;
	}

	function buildCandidates(relativePath) {
		var candidates = [];

		// absolute path from site root
		candidates.push('/' + relativePath);

		// try origin-based absolute URL
		try {
			candidates.push(window.location.origin + '/' + relativePath);
		} catch (e) {}

		// try script base (where main.js is hosted)
		var scripts = document.getElementsByTagName('script');
		for (var i = 0; i < scripts.length; i++) {
			var s = scripts[i].src || '';
			if (s.indexOf('assets/js/main.js') !== -1) {
				var base = s.slice(0, s.indexOf('assets/js/main.js'));
				candidates.push(base + 'assets/includes/' + relativePath.split('/').pop());
				break;
			}
		}

		// try a few relative depths (covers nested pages like portfolio/untitled-8)
		candidates.push('assets/includes/' + relativePath.split('/').pop());
		candidates.push('../assets/includes/' + relativePath.split('/').pop());
		candidates.push('../../assets/includes/' + relativePath.split('/').pop());
		candidates.push('../../../assets/includes/' + relativePath.split('/').pop());

		// de-duplicate while keeping order
		var seen = {};
		return candidates.filter(function(c) {
			if (!c) return false;
			if (seen[c]) return false;
			seen[c] = true;
			return true;
		});
	}

	function fetchFirst(candidates) {
		return new Promise(function(resolve, reject) {
			var i = 0;
			function next() {
				if (i >= candidates.length) return reject(new Error('All include fetches failed'));
				var url = candidates[i++];
				fetch(url, {cache: 'no-store'}).then(function(res) {
					if (!res.ok) return next();
					return res.text().then(function(text) { resolve({text: text, url: url}); });
				}).catch(function() { next(); });
			}
			next();
		});
	}

	function loadInclude(relativePath, selectorOrEl) {
		var candidates = buildCandidates(relativePath);
		fetchFirst(candidates).then(function(result) {
			if (typeof selectorOrEl === 'string') {
				var el = document.querySelector(selectorOrEl);
				injectHtml(el, result.text);
			} else if (selectorOrEl instanceof Element) {
				injectHtml(selectorOrEl, result.text);
			}
		}).catch(function(err) {
			console.warn('Include load failed for', relativePath, err);
		});
	}

	function doIncludes() {
		// Primary replacement: replace existing #header and .footer content
		loadInclude('assets/includes/header.html', '#header');
		var foot = document.querySelector('.footer');
		if (foot) loadInclude('assets/includes/footer.html', foot);

		// Support placeholders: <div data-include="header"></div>
		document.querySelectorAll('[data-include="header"]').forEach(function(el) {
			loadInclude('assets/includes/header.html', el);
		});
		document.querySelectorAll('[data-include="footer"]').forEach(function(el) {
			loadInclude('assets/includes/footer.html', el);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', doIncludes);
	} else {
		// DOM already ready — run immediately
		doIncludes();
	}

})();
