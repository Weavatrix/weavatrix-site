// Appearance controller.
//
// The choice is auto, light, or dark, and it lives in localStorage - no
// cookie, nothing sent anywhere. `data-theme` on the root element records the
// choice and `data-theme-resolved` records what it currently means, so the
// stylesheet can express the light theme once rather than duplicating every
// rule between a media query and an attribute selector.
//
// The head of every page carries a small copy of the read-and-stamp step so
// the correct theme is on the element before first paint. This file adds the
// parts that need the document: the controls, a system change arriving while
// the visitor is on auto, and another tab changing the choice.
(function () {
  var KEY = 'weavatrix-theme'
  var CHOICES = ['auto', 'light', 'dark']
  var root = document.documentElement
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null

  function stored() {
    try {
      var value = localStorage.getItem(KEY)
      return CHOICES.indexOf(value) === -1 ? 'auto' : value
    } catch (error) {
      // Private windows and blocked site data throw on access rather than
      // returning null. Auto is the default anyway.
      return 'auto'
    }
  }

  function resolve(choice) {
    if (choice === 'light' || choice === 'dark') return choice
    return media && media.matches ? 'light' : 'dark'
  }

  function paint(choice) {
    root.setAttribute('data-theme', choice)
    root.setAttribute('data-theme-resolved', resolve(choice))
    var controls = document.querySelectorAll('[data-theme-choice]')
    for (var index = 0; index < controls.length; index += 1) {
      var control = controls[index]
      control.setAttribute('aria-pressed', control.getAttribute('data-theme-choice') === choice ? 'true' : 'false')
    }
  }

  function choose(choice) {
    if (CHOICES.indexOf(choice) === -1) return
    try {
      localStorage.setItem(KEY, choice)
    } catch (error) {
      // The choice still applies to this page; it just will not survive.
    }
    paint(choice)
  }

  paint(stored())

  document.addEventListener('click', function (event) {
    var target = event.target
    var control = target && target.closest ? target.closest('[data-theme-choice]') : null
    if (control) choose(control.getAttribute('data-theme-choice'))
  })

  if (media) {
    var follow = function () {
      if (stored() === 'auto') paint('auto')
    }
    if (media.addEventListener) media.addEventListener('change', follow)
    else if (media.addListener) media.addListener(follow)
  }

  window.addEventListener('storage', function (event) {
    if (event.key === KEY) paint(stored())
  })
})()
