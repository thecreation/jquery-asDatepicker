/*
 * datepicker
 * https://github.com/amazingsurge/jquery-datepicker
 *
 * Copyright (c) 2013 amazingSurge
 * Licensed under the MIT license.
 */
(function($) {

    var Datepicker = $.datepicker = function(element, options) {
        this.$el = $(element);
        var meta_data = [],
            self = this;
        $.each(this.$el.data(), function(k, v) {
            meta_data[k] = self._parseHtmlString(k, v);
        });
        this.options = $.extend(true, {}, Datepicker.defaults, options, meta_data);
        this._init();
    };

    var $doc = $(document);

    var LABEL = {};

    var SHOWED = 0;

    Datepicker.defaults = {
        firstDayOfWeek: 0, //0---6 === sunday---saturday

        mode: 'single', //single|range|multiple

        rangeMode: 'default', // default|section|array

        displayMode: 'dropdown', //dropdown|inline

        calendars: 3,

        date: 'today', //today|Date (yyyy-mm-dd)

        keyboard: true, //true | false

        rangeSeparator: '-',

        multipleSeparator: ',',

        max: null,
        // max: '2013-10-1',//null|days|Date with (yyyy-mm-dd)
        min: null,
        // min: '2012-12-1',//null|days|Date with (yyyy-mm-dd)

        position: 'bottom', //top|right|bottom|left|rightTop|leftTop

        alwaysShow: false, // true or false

        onceClick: false, // true or false

        selectableYear: [],
        //[{from: 1980, to: 1985}, 1988, {from: 2000, to: 2010}, 2013],
        selectableMonth: [], //months from 0 - 11 (jan to dec)
        //[1, {from: 3, to: 10}, 12 ],
        selectableDay: [], //days of week 0-6 (su to sa)

        // selectableDate: [],
        selectableDate: [],
        //['2013-8-1', {from: '2013-8-5', to: '2013-8-10'}, {from: -30, to: 30}], {from: 10, to: 30}, {from: -30, to: 0}, {from:-30, to: 30}],

        disableYear: [],

        disableMonth: [],

        disableDay: [],

        // disableDate: [],
        disableDate: [], //range can not repeat

        lang: 'en', //'chinese'

        views: ['days'], // ['days'], ['days', 'months', 'years']

        format: 'yyyy/mm/dd',
        namespace: 'calendar',
        tplWrapper: function() {
            return '<div class="namespace-wrap"></div>';
        },
        tplContent: function() {
            return '<div class="namespace-content">' +
                '<div class="namespace-header">' +
                '<span class="namespace-prev"></span>' +
                '<span class="namespace-caption"></span>' +
                '<span class="namespace-next"></span>' +
                '</div>' +
                '<div class="namespace-days"></div>' +
                '<div class="namespace-months"></div>' +
                '<div class="namespace-years"></div>' +
                '</div>';
        },
        localize: function(lang, label) {
            LABEL[lang] = label;
        },
        onRender: function() {},
        onChange: function() {},
        onBeforeShow: function() {},
        onShow: function() {},
        onBeforeHide: function() {},
        onHide: function() {}
    };

    Datepicker.defaults.localize("en", {
        days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        daysShort: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        // caption_format: 'mm yyyy'
    });

    Datepicker.defaults.localize("zh", {
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        daysShort: ["日", "一", "二", "三", "四", "五", "六"],
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        monthsShort: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"]
        // caption_format: 'yyyy年m月dd日'
    });

    Datepicker.prototype = {
        constructor: Datepicker,

        _keyboard: {
            init: function(self) {
                this.attach(self, this.gather(self));
            },
            destroy: function(self) {
                if (self.options.displayMode === 'dropdown') {
                    self.$el.off('keydown.dropdown');
                } else {
                    self.picker.off('keydown.inline');
                }
                self.bound = false;
            },
            keys: function() {
                return {
                    'LEFT': 37,
                    'UP': 38,
                    'RIGHT': 39,
                    'DOWN': 40,
                    'ENTER': 13,
                    'ESC': 27,
                    'CTRL': 17,
                    'ALT': 18,
                };
            },
            prevDate: function() {
                var i = this.focused,
                    date = this.mode === 'multiple' ? this.focusDate : this.focusDate[i];
                switch (this.views[i]) {
                    case 'days':
                        date.setDate(date.getDate() - 1);
                        if (new Date(date).setDate(1) === new Date(this.currentMonthDate[i]).setMonth(this.currentDate[i].getMonth() - 1)) {
                            this.prev(i, true);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                    case 'months':
                        date.setMonth(date.getMonth() - 1);
                        if (Date.parse(new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0)) ===
                            new Date(this.currentYearDate[i]).setFullYear(this.currentDate[i].getFullYear() - 1)) {
                            this.prev(i);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                    case 'years':
                        date.setFullYear(date.getFullYear() - 1);
                        if (date.getFullYear() === this.currentYear[i] - 8) {
                            this.prev(i);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                }
            },
            nextDate: function() {
                var i = this.focused,
                    date = this.mode === 'multiple' ? this.focusDate : this.focusDate[i];
                switch (this.views[i]) {
                    case 'days':
                        date.setDate(date.getDate() + 1);
                        if (new Date(date).setDate(1) === new Date(this.currentMonthDate[i]).setMonth(this.currentDate[i].getMonth() + 1)) {
                            this.next(i, true);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                    case 'months':
                        date.setMonth(date.getMonth() + 1);
                        if (Date.parse(new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0)) ===
                            new Date(this.currentYearDate[i]).setFullYear(this.currentDate[i].getFullYear() + 1)) {

                            this.next(i);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                    case 'years':
                        date.setFullYear(date.getFullYear() + 1);
                        if (date.getFullYear() === this.currentYear[i] + 5) {
                            this.next(i);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                }
            },
            upLine: function() {
                var i = this.focused,
                    date = this.mode === 'multiple' ? this.focusDate : this.focusDate[i];
                switch (this.views[i]) {
                    case 'days':
                        date.setDate(date.getDate() - 7);
                        if (new Date(date).setDate(1) === new Date(this.currentMonthDate[i]).setMonth(this.currentDate[i].getMonth() - 1)) {
                            this.prev(i, true);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                    case 'months':
                        date.setMonth(date.getMonth() - 3);
                        if (Date.parse(new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0)) ===
                            new Date(this.currentYearDate[i]).setFullYear(this.currentDate[i].getFullYear() - 1)) {
                            this.prev(i);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                    case 'years':
                        date.setFullYear(date.getFullYear() - 3);
                        if (date.getFullYear() <= this.currentYear[i] - 8) {
                            this.prev(i);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                }
            },
            downLine: function() {
                var i = this.focused,
                    date = this.mode === 'multiple' ? this.focusDate : this.focusDate[i];
                switch (this.views[i]) {
                    case 'days':
                        date.setDate(date.getDate() + 7);
                        if (new Date(date).setDate(1) === new Date(this.currentMonthDate[i]).setMonth(this.currentDate[i].getMonth() + 1)) {
                            this.next(i, true);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                    case 'months':
                        date.setMonth(date.getMonth() + 3);
                        if (Date.parse(new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0)) ===
                            new Date(this.currentYearDate[i]).setFullYear(this.currentDate[i].getFullYear() + 1)) {
                            this.next(i);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                    case 'years':
                        date.setFullYear(date.getFullYear() + 3);
                        if (date.getFullYear() >= this.currentYear[i] + 5) {
                            this.next(i);
                        } else {
                            this._manageViews(i);
                        }
                        break;
                }
            },
            prevPage: function() {
                if (this.mode === 'multiple') {
                    this.prev(this.focused);
                } else {
                    if (this.calendarPrevs.eq(this.focused).hasClass(this.namespace + '-blocked')) {
                        return false;
                    } else {
                        this.prev(this.focused, true);
                    }
                }
            },
            nextPage: function() {
                if (this.mode === 'multiple') {
                    this.next(this.focused);
                } else {
                    if (this.calendarNexts.eq(this.focused).hasClass(this.namespace + '-blocked')) {
                        return false;
                    } else {
                        this.next(this.focused, true);
                    }
                }
            },
            higherView: function() {
                if (this.mode === 'multiple') {
                    return false;
                } else {
                    var i = this.focused;
                    this._changeView('higher', i);
                    this._manageViews(i);
                }
            },
            lowerView: function() {
                if (this.mode === 'multiple') {
                    return false;
                } else {
                    var i = this.focused;
                    this._changeView('lower', i);
                    this._manageViews(i);
                }
            },
            prevCalendar: function() {
                if (this.mode === 'multiple') {
                    return false;
                } else {
                    var len = this.calendars.length;
                    if (--this.focused < 0) {
                        this.focused = len;
                    }
                }
            },
            nextCalendar: function() {
                if (this.mode === 'multiple') {
                    return false;
                } else {
                    var len = this.calendars.length;
                    if (++this.focused >= len) {
                        this.focused = 0;
                    }
                }
            },
            updateValue: function(self) {
                var i = self.focused,
                    date = self.mode === 'multiple' ? self.focusDate : self.focusDate[i];
                if (self.calendars.eq(i).find('.' + this.namespace + '_focus').hasClass(this.namespace + '_untouchable')) {
                    return false;
                } else {
                    switch (self.views[i]) {
                        case 'days':
                            switch (self.options.mode) {
                                case 'single':
                                case 'range':
                                    self.selectedDate[i] = new Date(date);
                                    break;
                                case 'multiple':
                                    var _date = Date.parse(new Date(date));
                                    if ($.inArray(_date, self.selectedDate) > -1) {
                                        $.each(self.selectedDate, function(nr, data) {
                                            if (data === _date) {
                                                self.selectedDate.splice(nr, 1);
                                                return false;
                                            }
                                        });
                                    } else {
                                        self.selectedDate.push(_date);
                                    }
                                    break;
                            }
                            break;
                        case 'months':
                            self.currentDate[i].setMonth(date.getMonth());
                            self.views[i] = 'days';
                            break;
                        case 'years':
                            self.currentDate[i].setFullYear(date.getFullYear());
                            self.views[i] = 'months';
                            break;
                    }
                    self._updateDate(i);
                    if (self.mode === 'range') {
                        self._manageViews(0);
                        self._manageViews(1);
                    } else if (self.mode === 'multiple') {
                        self._manageViews(i - 1);
                        self._manageViews(i);
                        self._manageViews(i + 1);
                    } else {
                        self._manageViews(i);
                    }
                    self._setValue();
                }
            },
            enter: function() {
                var inputValue = this.$el.val(),
                    self = this,
                    judge;
                if (inputValue === this.oldValue || this.oldValue === '') {
                    this._keyboard.updateValue(this);
                } else {
                    var parts;
                    switch (this.mode) {
                        case 'single':
                            var _date = Date.parse(inputValue);
                            if (_date) {
                                this.selectedDate[0] = new Date(_date);
                                this.currentDate[0] = new Date(this.selectedDate[0]);
                                this._updateDate(0);
                                this._manageViews(0);
                            }
                            break;
                        case 'range':
                            parts = this._stringSeparate(inputValue, this.options.rangeSeparator);
                            var from = Date.parse(parts[0]),
                                to = Date.parse(parts[1]);
                            if (parts.length === 2) {
                                judge = true;
                                if (from && to) {
                                    if (from > to) {
                                        judge = false;
                                    }
                                } else {
                                    judge = false;
                                }
                            } else {
                                judge = false;
                            }

                            if (judge === true) {
                                this.selectedDate[0] = new Date(from);
                                this.selectedDate[1] = new Date(to);
                                for (var i = 0; i < 2; i++) {
                                    this.currentDate[i] = new Date(this.selectedDate[i]);
                                    this._updateDate(i);
                                    this._manageViews(i);
                                }
                            } else {
                                this._keyboard.updateValue(this);
                            }
                            break;
                        case 'multiple':
                            parts = this._stringSeparate(inputValue, this.options.multipleSeparator);
                            var _parts = [];
                            judge = true;
                            for (var j = 0; j < parts.length; j++) {
                                var _date = Date.parse(parts[j]);
                                _parts.push(_date);
                                if (!Date.parse(parts[j])) {
                                    judge = false;
                                }
                            }
                            if (judge === true) {
                                this.selectedDate = [];
                                for (var k = 0; k < _parts.length; k++) {
                                    if ($.inArray(_parts[k], this.selectedDate) > -1) {
                                        $.each(this.selectedDate, function(nr, data) {
                                            if (data === _parts[k]) {
                                                self.selectedDate.splice(nr, 1);
                                                return false;
                                            }
                                        });
                                    } else {
                                        this.selectedDate.push(_parts[k]);
                                    }
                                }
                                for (var m = 0; m < this.options.calendars; m++) {
                                    this._updateDate(m);
                                    this._manageViews(m);
                                }
                            } else {
                                this._keyboard.updateValue(this);
                            }
                            break;
                    }
                }
                this._setValue();
            },
            esc: function() {
                this.$el.blur();
                this.hide();
            },
            tab: function() {
                this.pickerHide = true;
            },
            gather: function(self) {
                return {
                    left: $.proxy(this.prevDate, self),
                    up: $.proxy(this.upLine, self),
                    right: $.proxy(this.nextDate, self),
                    down: $.proxy(this.downLine, self),
                    ctrl_left: $.proxy(this.prevPage, self),
                    ctrl_up: $.proxy(this.higherView, self),
                    ctrl_right: $.proxy(this.nextPage, self),
                    ctrl_down: $.proxy(this.lowerView, self),
                    alt_left: $.proxy(this.prevCalendar, self),
                    alt_right: $.proxy(this.nextCalendar, self),
                    enter: $.proxy(this.enter, self),
                    esc: $.proxy(this.esc, self)
                };
            },
            press: function(e) {
                var key = e.keyCode || e.which,
                    map;
                if (e.ctrlKey) {
                    e.preventDefault();
                    map = this.map[17];
                } else if (e.altKey) {
                    e.preventDefault();
                    map = this.map[18];
                } else {
                    map = this.map;
                }
                if (key === 9) {
                    this._keyboard.tab.call(this);
                }

                if (key in map && typeof map[key] === 'function') {
                    e.preventDefault();
                    return map[key].call(this)
                }
            },
            attach: function(self, map) {
                var key, _self = this;
                for (key in map) {
                    if (map.hasOwnProperty(key)) {
                        var uppercase = [],
                            parts = self._stringSeparate(key, '_'),
                            len = parts.length;

                        if (len === 1) {
                            uppercase[0] = parts[0].toUpperCase();
                            self.map[this.keys()[uppercase[0]]] = map[key];
                        } else {
                            for (var i = 0; i < parts.length; i++) {
                                uppercase[i] = parts[i].toUpperCase();
                                if (i === 0) {
                                    if (self.map[this.keys()[uppercase[0]]] === undefined) {
                                        self.map[this.keys()[uppercase[0]]] = {};
                                    }
                                } else {
                                    self.map[this.keys()[uppercase[0]]][this.keys()[uppercase[i]]] = map[key];
                                }
                            }
                        }
                    }
                }
                if (!self.bound) {
                    self.bound = true;
                    if (self.options.displayMode === 'dropdown') {
                        self.$el.on('keydown.dropdown', function(e) {
                            _self.press.call(self, e);
                        });
                    } else {
                        self.picker.on('keydown.inline', function(e) {
                            _self.press.call(self, e);
                        });
                    }
                }
            }
        },

        _init: function() {
            //init the status
            this.format = this._parseFormat('yyyy-mm-dd');
            this.outputFormat = this._parseFormat(this.options.format || 'yyyy/mm/dd');
            this.mode = this.options.mode;
            this.namespace = this.options.namespace;
            this.focused = 0;
            this.map = {};
            this.pickerHide = false;
            this.flag = SHOWED++;
            this.selected = false;
            this.showed = false;
            this.bound = false;

            var wrapper = this.options.tplWrapper().replace(/namespace/g, this.namespace),
                content = this.options.tplContent().replace(/namespace/g, this.namespace),
                $wrapper = $(wrapper),
                self = this,
                calendars;

            //set calendars numeber
            switch (this.mode) {
                case 'single':
                    calendars = 1;
                    break;
                case 'range':
                    calendars = 2;
                    break;
                case 'multiple':
                    calendars = this.options.calendars;
                    this.options.views = ['days']
                    break;
            }
            this.options.calendars = calendars;

            //set base views
            for (var i = 0; i < this.options.calendars; i++) {
                $wrapper.append(content);
                this.options.views[i] = this.options.views[i] || 'days';
            }

            //make $wrapper can be focused
            $wrapper.attr('tabindex', '0');

            //displayMode 
            if (this.options.displayMode === 'inline') {
                this.$el.after($wrapper).addClass(this.namespace + '_hide')
                this.picker = $wrapper;
                this.options.alwaysShow = true;
                this.picker.addClass(this.namespace + '_show');
                this.picker.on({
                    focus: $.proxy(this._focus, this),
                    blur: $.proxy(this._blur, this)
                });
            } else if (this.options.displayMode === 'dropdown') {
                this.$el.on({
                    focus: $.proxy(this._focus, this),
                    blur: $.proxy(this._blur, this)
                });
                this.picker = $wrapper.appendTo('body');
                this.picker.addClass(this.namespace + '_absolute');
            }

            //init the sections
            this.views = this.options.views;
            this.calendars = this.picker.find('.' + this.namespace + '-content');
            this.calendarPrevs = this.calendars.find('.' + this.namespace + '-prev');
            this.calendarCaptions = this.calendars.find('.' + this.namespace + '-caption');
            this.calendarNexts = this.calendars.find('.' + this.namespace + '-next');
            this.daypickers = this.calendars.find('.' + this.namespace + '-days');
            this.monthpickers = this.calendars.find('.' + this.namespace + '-months');
            this.yearpickers = this.calendars.find('.' + this.namespace + '-years');

            this._initDate();

            for (var j = 0; j < this.options.calendars; j++) {
                this._manageViews(j);
            }

            //alwaysshow
            if (this.options.alwaysShow === true) {
                this.show();
            } else {
                this.showed = true;
                this.hide();
            }

            this._setValue();
        },
        _initDate: function() {
            var date = (this.options.data === 'today' ? new Date() : this._parseDate(this.options.date, this.format));
            this.currentDate = [new Date(date)];
            if (this.mode === 'multiple') {
                this.selectedDate = [];
                this.focusDate = new Date(date);
            } else {
                this.selectedDate = [new Date(date)];
                this.focusDate = [new Date(date)];
            }

            this.currentDay = [];
            this.currentMonth = [];
            this.currentYear = [];

            this.currentMonthDate = [];
            this.currentYearDate = [];

            this.selectedDay = [];
            this.selectedMonth = [];
            this.selectedYear = [];

            this.selectedMonthDate = [];
            this.selectedYearDate = [];

            //max and min
            if (this.options.max !== null) {
                this.maxDate = this._parseDate(this.options.max, this.format);
                this.maxMonth = this.maxDate.getMonth();
                this.maxYear = this.maxDate.getFullYear();
            }
            if (this.options.min !== null) {
                this.minDate = this._parseDate(this.options.min, this.format);
                this.minMonth = this.minDate.getMonth();
                this.minYear = this.minDate.getFullYear();
            }
            for (var i = 0; i < this.options.calendars; i++) {
                this.currentDate[i] = this.currentDate[i] || new Date(date);
                if (this.mode === 'multiple') {
                    this._setDate(this.currentDate[i], 'month', this.currentDate[i].getMonth() + i);
                } else {
                    this.selectedDate[i] = this.selectedDate[i] || new Date(date);
                    this.selectedDate[i].setHours(0, 0, 0, 0);

                    this.focusDate[i] = this.focusDate[i] || new Date(date);
                    this.focusDate[i].setHours(0, 0, 0, 0);
                }
                this._updateDate(i);
            }

            //rangeMode
            this.selectableDate = this.options.selectableDate.length > 0 ? true : false;
            this.disableDate = this.options.disableDate.length > 0 ? true : false;

            this.yearSelectable = this.options.selectableYear.length > 0 ? true : false;
            this.monthSelectable = this.options.selectableMonth.length > 0 ? true : false;
            this.daySelectable = this.options.selectableDay.length > 0 ? true : false;

            this.yearDisable = this.options.disableYear.length > 0 ? true : false;
            this.monthDisable = this.options.disableMonth.length > 0 ? true : false;
            this.dayDisable = this.options.disableDay.length > 0 ? true : false;

            switch (this.options.rangeMode) {
                case 'section':
                    if (this.options.selectableYear.length > 0) {
                        this.selectableYear = true;
                    }
                    this.yearSection = this.yearSelectable === true ? this._parseAble(this.options.selectableYear) :
                        (this.yearDisable === true ? this._parseAble(this.options.disableYear) : null);
                    this.monthSection = this.monthSelectable === true ? this._parseAble(this.options.selectableMonth) :
                        (this.monthDisable === true ? this._parseAble(this.options.disableMonth) : null);
                    this.daySection = this.daySelectable === true ? this._parseAble(this.options.selectableDay) :
                        (this.dayDisable === true ? this._parseAble(this.options.disableDay) : null);
                    break;
                case 'array':
                    this.arrayRange = this.selectableDate === true ? this._parseAbleDate(this.options.selectableDate, this.format) :
                        (this.disableDate === true ? this._parseAbleDate(this.options.disableDate, this.format) : null);
                    this.arrayRangeMonth = this._changeDateLevel('month', this.arrayRange);
                    this.arrayRangeYear = this._changeDateLevel('year', this.arrayRange);
                    break;
            }
        },
        _changeDateLevel: function(level, array) {
            var self = this,
                _array = [];
            $.each(array, function(i, n) {
                if (n.length === undefined) {
                    var date = '';
                    switch (level) {
                        case 'month':
                            date = new Date(n.getFullYear(), n.getMonth(), 1, 0, 0, 0, 0);
                            break;
                        case 'year':
                            date = new Date(n.getFullYear(), 0, 1, 0, 0, 0, 0);
                            break;
                    }
                } else if (n.length === 2) {
                    var date = [];
                    switch (level) {
                        case 'month':
                            date[0] = new Date(n[0].getFullYear(), n[0].getMonth(), 1, 0, 0, 0, 0);
                            date[1] = new Date(n[1].getFullYear(), n[1].getMonth(), 1, 0, 0, 0, 0);
                            break;
                        case 'year':
                            date[0] = new Date(n[0].getFullYear(), 0, 1, 0, 0, 0, 0);
                            date[1] = new Date(n[1].getFullYear(), 0, 1, 0, 0, 0, 0);
                            break;
                    }
                }
                _array.push(date);
            });
            return _array;
        },
        _updateDate: function(i) {
            this.currentDate[i].setDate(1);
            this.currentDate[i].setHours(0, 0, 0, 0);

            this.currentDay[i] = this.currentDate[i].getDate();
            this.currentMonth[i] = this.currentDate[i].getMonth();
            this.currentYear[i] = this.currentDate[i].getFullYear();

            this.currentMonthDate[i] = new Date(this.currentYear[i], this.currentMonth[i], 1, 0, 0, 0, 0);
            this.currentYearDate[i] = new Date(this.currentYear[i], 0, 1, 0, 0, 0, 0);

            if (this.mode !== 'multiple') {
                this.selectedDay[i] = this.selectedDate[i].getDate();
                this.selectedMonth[i] = this.selectedDate[i].getMonth();
                this.selectedYear[i] = this.selectedDate[i].getFullYear();

                this.selectedMonthDate[i] = new Date(this.selectedYear[i], this.selectedMonth[i], 1, 0, 0, 0, 0);
                this.selectedYearDate[i] = new Date(this.selectedYear[i], 0, 1, 0, 0, 0, 0);
            }
        },
        _inArray: function(target, array) {
            if ($.inArray(target, array) === -1) {
                return false;
            } else {
                return true;
            }
        },
        _stringSeparate: function(str, separator) {
            var re = new RegExp("[.\\" + separator + "\\s].*?"),
                separator = str.match(re),
                parts = str.split(separator);
            return parts;
        },
        _parseHtmlString: function(option, value) {
            var array = [],
                options = Datepicker.defaults;
            if (typeof options[option] === 'object') {
                var parts = this._stringSeparate(value, ','),
                    sub_parts;
                for (var i = 0; i < parts.length; i++) {
                    sub_parts = this._stringSeparate(parts[i], '>')
                    if (sub_parts.length > 1) {
                        sub_parts = {
                            'from': sub_parts[0],
                            'to': sub_parts[1]
                        };
                    } else {
                        sub_parts = sub_parts[0];
                    }
                    array.push(sub_parts)
                }
                return array;
            } else {
                return value;
            }
        },
        _setDate: function(obj, YTD, date) {
            if (typeof YTD === 'object') {
                for (var key in YTD) {
                    switch (key) {
                        case 'day':
                            obj.setDate(YTD[key]);
                            break;
                        case 'month':
                            obj.setMonth(YTD[key]);
                            break;
                        case 'year':
                            obj.setYear(YTD[key]);
                            break;
                    }
                }
            } else {
                switch (YTD) {
                    case 'day':
                        obj.setDate(date);
                        break;
                    case 'month':
                        obj.setMonth(date);
                        break;
                    case 'year':
                        obj.setYear(date);
                        break;
                }
            }
        },
        _parseFormat: function(format) {
            var separator = format.match(/[.\/\-\s].*?/),
                parts = format.split(/\W+/) || parts;
            if (!parts || parts.length === 0) {
                throw new Error('Invalid date format.');
            }
            return {
                separator: separator,
                parts: parts
            };
        },
        _formatDate: function(date, format) {
            var val = {
                d: date.getDate(),
                m: date.getMonth() + 1,
                yy: date.getFullYear().toString().substring(2),
                yyyy: date.getFullYear()
            };
            val.dd = (val.d < 10 ? '0' : '') + val.d;
            val.mm = (val.m < 10 ? '0' : '') + val.m;
            date = [];
            for (var i = 0, length = format.parts.length; i < length; i++) {
                date.push(val[format.parts[i]]);
            }
            return date.join(format.separator);
        },
        _parseDate: function(data, format) {
            switch (typeof(data)) {
                case 'string':
                    if (data.length < 5) {
                        var date = new Date(),
                            day = date.getDate();
                        date.setHours(0, 0, 0, 0);
                        date.setDate(day + Number(data));
                    } else {
                        var parts = data.split(format.separator) || parts,
                            date = new Date(),
                            val;
                        date.setHours(0, 0, 0, 0);
                        if (parts.length === format.parts.length) {
                            for (var i = 0, length = format.parts.length; i < length; i++) {
                                val = parseInt(parts[i], 10) || 1;
                                if (val === '1') {
                                    return;
                                }
                                switch (format.parts[i]) {
                                    case 'dd':
                                    case 'd':
                                        date.setDate(val);
                                        break;
                                    case 'mm':
                                    case 'm':
                                        date.setMonth(val - 1);
                                        break;
                                    case 'yy':
                                        date.setFullYear(2000 + val);
                                        break;
                                    case 'yyyy':
                                        date.setFullYear(val);
                                        break;
                                }
                            }
                        }
                    }
                    break;
                case 'number':
                    var date = new Date(),
                        day = date.getDate();
                    date.setHours(0, 0, 0, 0);
                    date.setDate(day + data);
                    break;
            }
            return date;
        },
        _parseAbleDate: function(arr, format) {
            var array = [],
                count = 0;
            for (var i = 0; i < arr.length; i++) {
                if (typeof(arr[i]) === 'string') {
                    array[count++] = this._parseDate(arr[i], format);
                } else if (typeof(arr[i]) === 'object') {
                    var obj = arr[i],
                        from, to, startDate, endDate;
                    for (var key in obj) {
                        switch (key) {
                            case 'from':
                                from = obj[key];
                                break;
                            case 'to':
                                to = obj[key];
                                break;
                        }
                    }
                    array[count++] = [this._parseDate(from, format), this._parseDate(to, format)];
                }
            }
            return array;
        },
        _parseAble: function(arr) {
            var array = [],
                count = 0;
            for (var i = 0; i < arr.length; i++) {
                if (typeof(arr[i]) === 'number') {
                    array[count++] = arr[i];
                } else if (typeof(arr[i]) === 'string') {
                    array[count++] = Number(arr[i]);
                } else if (typeof(arr[i]) === 'object') {
                    var obj = arr[i],
                        from, to;
                    for (var key in obj) {
                        switch (key) {
                            case 'from':
                                from = Number(obj[key]);
                                break;
                            case 'to':
                                to = Number(obj[key]);
                                break;
                        }
                    }
                    for (var j = from; j <= to; j++) {
                        array[count++] = j;
                    }
                }
            }
            return array;
        },
        _position: function() {
            var win_height = window.innerHeight,
                win_width = window.innerWidth,
                calendar_height = this.picker.outerHeight(),
                calendar_width = this.picker.outerWidth(),
                input_top = this.$el.offset().top,
                input_left = this.$el.offset().left,
                input_height = this.$el.outerHeight(),
                input_width = this.$el.outerWidth(),
                scroll_top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0,
                scroll_left = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
                to_top = input_top - scroll_top,
                to_bottom = win_height - to_top - input_height,
                to_left = input_left - scroll_left,
                to_right = win_width - to_left - input_width;
            switch (this.options.position) {
                case 'top':
                    this.picker.css({
                        "left": to_left + scroll_left,
                        "top": to_top - calendar_height + scroll_top
                    });
                    break;
                case 'right':
                    this.picker.css({
                        "left": to_left + input_width + scroll_left,
                        "top": to_top + scroll_top
                    });
                    break;
                case 'bottom':
                    this.picker.css({
                        "left": to_left + scroll_left,
                        "top": to_top + input_height + scroll_top
                    });
                    break;
                case 'left':
                    this.picker.css({
                        "left": to_left - calendar_width + scroll_left,
                        "top": to_top + scroll_top
                    });
                    break;
                case 'rightTop':
                    this.picker.css({
                        "left": to_left + input_width + scroll_left,
                        "top": to_top - calendar_height + input_height + scroll_top
                    });
                    break;
                case 'leftTop':
                    this.picker.css({
                        "left": to_left - calendar_width + scroll_left,
                        "top": to_top - calendar_height + input_height + scroll_top
                    });
                    break;
            }
        },
        _setPoint: function(type, status, currentDate, selectedDate) {
            var _status = status;

            switch (type) {
                case '=':
                    if (currentDate === selectedDate) {
                        _status = true;
                    }
                    break;
                case '<':
                    if (currentDate < selectedDate) {
                        _status = true;
                    }
                    break;
                case '>':
                    if (currentDate > selectedDate) {
                        _status = true;
                    }
                    break;
            }
            return _status;
        },
        _setSection: function(status, currentDate, startDate, endDate) {
            var _status = status,
                _current = Date.parse(currentDate),
                _start = Date.parse(startDate),
                _end = Date.parse(endDate);
            if (_current >= _start && _current <= _end) {
                _status = true;
            }
            return _status;
        },
        _setRange: function(mode, view, status, currentDate, dateArray) {
            var _status = status,
                i, _current, self = this;
            if (mode === 'section') {
                _status = this._inArray(currentDate, dateArray);
            } else if (mode === 'array') {
                $.each(dateArray, function(j, n) {
                    switch (n.length) {
                        case undefined:
                            if (Date.parse(currentDate) === Date.parse(n)) {
                                _status = true;
                            }
                            break;
                        case 2:
                            _status = self._setSection(_status, currentDate, n[0], n[1]);
                            break;
                    }
                });
            }
            return _status;
        },
        _judgeLock: function(i) {
            var prevLock = false,
                nextLock = false,
                current, selected;
            switch (this.mode) {
                case 'range':
                    if (i === 0) {
                        switch (this.views[i]) {
                            case 'days':
                                current = Date.parse(this.currentDate[i]);
                                selected = Date.parse(this.selectedMonthDate[1]);
                                break;
                            case 'months':
                                current = Date.parse(this.currentYearDate[i]);
                                selected = Date.parse(this.selectedYearDate[1]);
                                break;
                            case 'years':
                                current = new Date(this.currentYearDate[i]).setFullYear(this.currentYear[i] + 4);
                                selected = Date.parse(this.selectedYearDate[1]);
                                break;
                        }
                        nextLock = !this._setPoint('<', nextLock, current, selected);
                    } else {
                        switch (this.views[i]) {
                            case 'days':
                                current = Date.parse(this.currentDate[i]);
                                selected = Date.parse(this.selectedMonthDate[0]);
                                break;
                            case 'months':
                                current = Date.parse(this.currentYearDate[i]);
                                selected = Date.parse(this.selectedYearDate[0]);
                                break;
                            case 'years':
                                current = new Date(this.currentYearDate[i]).setFullYear(this.currentYear[i] + 4);
                                selected = Date.parse(this.selectedYearDate[0]);
                                break;
                        }
                        prevLock = !this._setPoint('>', prevLock, current, selected);
                    }
                    break;
                case 'multiple':
                    if (i === 0) {
                        nextLock = true;
                    } else if (i === this.options.calendars - 1) {
                        prevLock = true;
                    } else {
                        prevLock = nextLock = true;
                    }
                    break;
            }
            if (prevLock === true) {
                this.calendarPrevs.eq(i).addClass(this.namespace + '_blocked');
            } else {
                this.calendarPrevs.eq(i).removeClass(this.namespace + '_blocked');
            }

            if (nextLock === true) {
                this.calendarNexts.eq(i).addClass(this.namespace + '_blocked');
            } else {
                this.calendarNexts.eq(i).removeClass(this.namespace + '_blocked');
            }
        },
        _judgeRange: function(view, status, currentDate) {
            var rangeUntouch = status,
                mode = this.options.rangeMode,
                dateArray, _current,
                self = this;
            isUntouch = false;
            if (mode === 'section') {
                switch (view) {
                    case 'days':
                        dateArray = this.daySection;
                        _current = currentDate.getDay();
                        break;
                    case 'months':
                        dateArray = this.monthSection;
                        _current = currentDate.getMonth();
                        break;
                    case 'years':
                        dateArray = this.yearSection;
                        _current = currentDate.getFullYear();
                        break;
                }
                rangeUntouch = this._inArray(_current, dateArray);
            } else if (mode === 'array') {
                switch (view) {
                    case 'days':
                        dateArray = this.arrayRange;
                        break;
                    case 'months':
                        dateArray = this.arrayRangeMonth;
                        break;
                    case 'years':
                        dateArray = this.arrayRangeYear;
                        break;
                }
                $.each(dateArray, function(j, n) {
                    switch (n.length) {
                        case undefined:
                            if (Date.parse(currentDate) === Date.parse(n)) {
                                rangeUntouch = true;
                            }
                            break;
                        case 2:
                            rangeUntouch = self._setSection(rangeUntouch, currentDate, n[0], n[1]);
                            break;
                    }
                });
            }
            return rangeUntouch;
        },
        _judgeStatus: function(i, view, mode, status, currentDate, selectedDate) {
            var untouch = status[0],
                active = status[1],
                inRange = status[2];
            switch (mode) {
                case 'single':
                    active = this._setPoint('=', active, Date.parse(currentDate), Date.parse(selectedDate[i]));
                    break;
                case 'range':
                    active = this._setPoint('=', active, Date.parse(currentDate), Date.parse(selectedDate[i]));
                    inRange = this._setSection(inRange, currentDate, selectedDate[0], selectedDate[1]);
                    if (i === 0) {
                        untouch = this._setPoint('>', untouch, Date.parse(currentDate), Date.parse(selectedDate[1]));
                    } else if (i === 1) {
                        untouch = this._setPoint('<', untouch, Date.parse(currentDate), Date.parse(selectedDate[0]));
                    }
                    break;
                case 'multiple':
                    for (var j = 0; j < this.selectedDate.length; j++) {
                        if (Date.parse(currentDate) === selectedDate[j]) {
                            active = true;
                        }
                    }
                    break;
            }
            return status = [untouch, active, inRange];
        },
        _renderStatus: function(status) {
            var untouch = status[0],
                active = status[1],
                inRange = status[2],
                rangeUntouch = status[3],
                className = '';
            if (rangeUntouch === true) {
                className = ' ' + this.namespace + '_untouchable';
            } else {
                if (untouch === true) {
                    className = ' ' + this.namespace + '_untouchable';
                }
                if (inRange === true) {
                    className += ' ' + this.namespace + '_inRange';
                }
            }
            if (active === true) {
                className += ' ' + this.namespace + '_active';
            }
            return className;
        },
        _manageViews: function(i) {
            switch (this.views[i]) {
                case 'days':
                    this._generateDaypicker(i);
                    this.calendars.eq(i).addClass(this.namespace + '_days');
                    this.calendars.eq(i).removeClass(this.namespace + '_months');
                    this.calendars.eq(i).removeClass(this.namespace + '_years');
                    break;
                case 'months':
                    this._generateMonthpicker(i);
                    this.calendars.eq(i).removeClass(this.namespace + '_days');
                    this.calendars.eq(i).addClass(this.namespace + '_months');
                    this.calendars.eq(i).removeClass(this.namespace + '_years');
                    break;
                case 'years':
                    this._generateYearpicker(i);
                    this.calendars.eq(i).removeClass(this.namespace + '_days');
                    this.calendars.eq(i).removeClass(this.namespace + '_months');
                    this.calendars.eq(i).addClass(this.namespace + '_years');
                    break;
            }
        },
        _generateDaypicker: function(i) {
            this._generateHeader(i, LABEL[this.options.lang].months[this.currentMonth[i]] + ' ' + this.currentYear[i]);
            this.daypickers.eq(i).html(this._buildDays(i));
        },
        _generateMonthpicker: function(i) {
            this._generateHeader(i, this.currentYear[i]);
            this.monthpickers.eq(i).html(this._buildMonths(i));
        },
        _generateYearpicker: function(i) {
            this._generateHeader(i, this.currentYear[i] - 7 + this.options.rangeSeparator + (this.currentYear[i] + 4));
            this.yearpickers.eq(i).html(this._buildYears(i));
        },
        _generateHeader: function(i, caption) {
            this.calendarCaptions.eq(i).html(caption);
            this._judgeLock(i);
        },
        _buildDays: function(i) {
            var year = this.currentYear[i],
                month = this.currentMonth[i],
                day,
                daysInMonth = new Date(year, month + 1, 0).getDate(),
                firstDay = new Date(year, month, 1).getDay(),
                daysInPrevMonth = new Date(year, month, 0).getDate(),
                daysFromPrevMonth = firstDay - this.options.firstDayOfWeek,
                html = '<div class="' + this.namespace + '-head">',
                isUntouch, isActive, isInRange, rangeUntouch, content, className,
                status = [],
                dateArray = [];

            daysFromPrevMonth = daysFromPrevMonth < 0 ? 7 + daysFromPrevMonth : daysFromPrevMonth;

            for (var j = 0; j < 7; j++) {
                html += '<span>' + LABEL[this.options.lang].daysShort[j] + '</span>';
            }

            html += '</div><div class="' + this.namespace + '-body"><div class="' + this.namespace + '-row">';

            for (var m = 0; m < 42; m++) {
                day = (m - daysFromPrevMonth + 1);
                isActive = false;
                isInRange = false;
                isUntouch = false;
                rangeUntouch = false;
                status = [isUntouch, isActive, isInRange, rangeUntouch];
                content = 0;
                className = '';

                if (m > 0 && m % 7 === 0) {
                    html += '</div><div class="' + this.namespace + '-row">';
                }
                if (m < daysFromPrevMonth) {
                    className = this.namespace + '_otherMonth';
                    content = (daysInPrevMonth - daysFromPrevMonth + m + 1);
                    dateArray[m] = new Date(year, month - 1, content, 0, 0, 0, 0);
                } else if (m > (daysInMonth + daysFromPrevMonth - 1)) {
                    className = this.namespace + '_otherMonth';
                    content = (day - daysInMonth);
                    dateArray[m] = new Date(year, (month + 1), content, 0, 0, 0, 0);
                } else {
                    dateArray[m] = new Date(year, month, day, 0, 0, 0, 0);
                    content = day;
                    if (this.mode === 'multiple') {
                        if (Date.parse(dateArray[m]) === Date.parse(this.focusDate)) {
                            className += ' ' + this.namespace + '_focus'
                        }
                    } else {
                        if (Date.parse(dateArray[m]) === Date.parse(this.focusDate[i])) {
                            className += ' ' + this.namespace + '_focus'
                        }
                    }

                }
                status = this._judgeStatus(i, 'days', this.mode, status, dateArray[m], this.selectedDate);
                status[3] = this._judgeRange('days', status[3], dateArray[m]);
                if ((this.options.rangeMode === 'section' && this.daySelectable === true) ||
                    (this.options.rangeMode === 'array' && this.selectableDate === true)) {
                    status[3] = !status[3];
                }

                className += this._renderStatus(status);

                html += '<span class="' + className + '">' + content + '</span>';
            }
            html += '</div></div>';
            return html;
        },
        _buildMonths: function(i) {
            var year = this.currentYear[i],
                html = '',
                className,
                content = LABEL[this.options.lang].monthsShort,
                focus = this.focusDate[i],
                dateArray = [],
                isActive, isInRange, isUntouch, rangeUntouch,
                status = [];

            html += '<div class="' + this.namespace + '-row">';
            for (var m = 0; m < 12; m++) {
                isActive = false;
                isInRange = false;
                isUntouch = false;
                rangeUntouch = false;
                status = [isUntouch, isActive, isInRange, rangeUntouch];
                className = '';

                if (m > 0 && m % 3 === 0) {
                    html += '</div><div class="' + this.namespace + '-row">';
                }
                dateArray[m] = new Date(year, m, 1, 0, 0, 0, 0);

                status = this._judgeStatus(i, 'months', this.mode, status, dateArray[m], this.selectedMonthDate);
                status[3] = this._judgeRange('months', status[3], dateArray[m]);
                if ((this.options.rangeMode === 'section' && this.monthSelectable === true) ||
                    (this.options.rangeMode === 'array' && this.selectableDate === true)) {
                    status[3] = !status[3];
                }
                if (Date.parse(dateArray[m]) === Date.parse(new Date(focus.getFullYear(), focus.getMonth(), 1, 0, 0, 0, 0))) {
                    className += ' ' + this.namespace + '_focus'
                }
                className += this._renderStatus(status);

                html += '<span class="month-' + m + ' ' + className + '">' + content[m] + '</span>'
            }
            html += '</div>';
            return html;
        },
        _buildYears: function(i) {
            var year = this.currentYear[i],
                html = '',
                className,
                content = 0,
                dateArray = [],
                focus = this.focusDate[i],
                isActive, isInRange, isUntouch, rangeUntouch,
                status = [];

            html += '<div class="' + this.namespace + '-row">';
            for (var m = 0; m < 12; m++) {
                isActive = false;
                isInRange = false;
                isUntouch = false;
                rangeUntouch = false;
                status = [isUntouch, isActive, isInRange, rangeUntouch];
                className = '';

                content = year - 7 + m;
                if (m > 0 && m % 3 === 0) {
                    html += '</div><div class="' + this.namespace + '-row">';
                }
                dateArray[m] = new Date(content, 0, 1, 0, 0, 0, 0);

                status = this._judgeStatus(i, 'years', this.mode, status, dateArray[m], this.selectedYearDate);
                status[3] = this._judgeRange('years', status[3], dateArray[m]);
                if ((this.options.rangeMode === 'section' && this.yearSelectable === true) ||
                    (this.options.rangeMode === 'array' && this.selectableDate === true)) {
                    status[3] = !status[3];
                }
                if (Date.parse(dateArray[m]) === Date.parse(new Date(focus.getFullYear(), 0, 1, 0, 0, 0, 0))) {
                    className += ' ' + this.namespace + '_focus'
                }
                className += this._renderStatus(status);

                html += '<span class="' + className + '">' + content + '</span>';
            }
            html += '</div>';
            return html;
        },
        _click: function(e) {
            if ($(e.target).closest(this.picker).length === 0 && $(e.target).closest(this.$el).length === 0 && this.options.alwaysShow === false) {
                this.hide();
            } else if ($(e.target).closest(this.$el).length !== 1 && $(e.target).closest(this.picker).length === 1) {
                var _target = $(e.target).closest('span');
                if (_target.length === 1) {
                    var i = _target.parents('.' + this.namespace + '-content').index();
                    switch (_target[0].className) {
                        case this.namespace + '-caption':
                            this._changeView('caption', i);
                            this._manageViews(i);
                            break;
                        case this.namespace + '-prev':
                            this.prev(i);
                            break;
                        case this.namespace + '-next':
                            this.next(i);
                            break;
                        default:
                            if (!_target.hasClass(this.namespace + '_otherMonth') && !_target.hasClass(this.namespace + '_untouchable') && _target.parents('.calendar-week').length !== 1) {
                                this._changeValue(_target, i);
                                if (this.views[i] === 'days' && this.mode === 'single') {
                                    this.selected = true;
                                }
                                this._changeView('content', i);
                                this._updateDate(i);
                                if (this.mode === 'range') {
                                    this._manageViews(0);
                                    this._manageViews(1);
                                } else if (this.mode === 'multiple') {
                                    this._manageViews(i - 1);
                                    this._manageViews(i);
                                    this._manageViews(i + 1);
                                } else if (this.mode === 'single') {
                                    this._manageViews(i);
                                }
                                this._setValue();
                            } else {
                                return false;
                            }
                            break;
                    }
                }
                if (this.selected === true && this.options.alwaysShow === false && this.mode === 'single' && this.options.onceClick === true) {
                    this.hide();
                } else {
                    if (this.options.displayMode === 'dropdown') {
                        this.$el.focus();
                    }
                }
            }
        },
        _changeView: function(type, i) {
            switch (type) {
                case 'caption':
                    if (this.options.mode !== 'multiple') {
                        if (this.views[i] === 'days') {
                            this.views[i] = 'months';
                        } else if (this.views[i] === 'months') {
                            this.views[i] = 'years';
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                    break;
                case 'content':
                    if (this.views[i] === 'years') {
                        this.views[i] = 'months';
                    } else if (this.views[i] === 'months') {
                        this.views[i] = 'days';
                    } else {
                        return false;
                    }
                    break;
                case 'higher':
                    if (this.options.mode !== 'multiple') {
                        if (this.views[i] === 'days') {
                            this.views[i] = 'months';
                        } else if (this.views[i] === 'months') {
                            this.views[i] = 'years';
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                    break;
                case 'lower':
                    if (this.options.mode !== 'multiple') {
                        if (this.views[i] === 'years') {
                            this.views[i] = 'months';
                        } else if (this.views[i] === 'months') {
                            this.views[i] = 'days';
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                    break;

            }
        },
        _changeValue: function(target, i) {
            var newVal = '',
                newDate = '',
                self = this;
            switch (this.views[i]) {
                case 'years':
                    newVal = parseInt(target.text(), 10);
                    this.currentDate[i].setYear(newVal);
                    break;
                case 'months':
                    newVal = Number(target.attr('class').match(/month\-([0-9]+)/)[1]);
                    this.currentDate[i].setMonth(newVal);
                    break;
                case 'days':
                    newVal = parseInt(target.text(), 10);
                    newDate = new Date(this.currentYear[i], this.currentMonth[i], newVal, 0, 0, 0, 0);
                    switch (this.options.mode) {
                        case 'single':
                        case 'range':
                            this.selectedDate[i] = newDate;
                            break;
                        case 'multiple':
                            var date = Date.parse(newDate);
                            if ($.inArray(date, this.selectedDate) > -1) {
                                $.each(this.selectedDate, function(nr, data) {
                                    if (data === date) {
                                        self.selectedDate.splice(nr, 1);
                                        return false;
                                    }
                                });
                            } else {
                                this.selectedDate.push(date);
                            }
                            break;
                    }
                    break;
            }
        },
        _setValue: function() {
            switch (this.mode) {
                case 'single':
                    var formated = this._formatDate(this.selectedDate[0], this.outputFormat);
                    this.$el.val(formated);
                    break;
                case 'range':
                    var formatedStart = this._formatDate(this.selectedDate[0], this.outputFormat),
                        formatedEnd = this._formatDate(this.selectedDate[1], this.outputFormat);
                    this.$el.val(formatedStart + this.options.rangeSeparator + formatedEnd);
                    break;
                case 'multiple':
                    var val = '',
                        formated;
                    for (var j = 0; j < this.selectedDate.length; j++) {
                        formated = this._formatDate(new Date(this.selectedDate[j]), this.outputFormat);
                        if (val.length === 0) {
                            val += formated;
                        } else {
                            val += (this.options.multipleSeparator + formated);
                        }
                    }
                    this.$el.val(val);
                    break;
            }
            if (this.options.onChange) {
                this.options.onChange.apply(this);
            }
            this.oldValue = this.$el.val();
        },
        _focus: function() {
            if (this.options.displayMode === 'dropdown' && this.showed === false) {
                this.show();
            }
            if (this.options.keyboard) {
                this._keyboard.init(this);
            }
        },
        _blur: function() {
            if (this.options.displayMode === 'dropdown') {
                if (this.pickerHide === true) {
                    this.hide();
                    this.pickerHide = false;
                }
            }

            if (this.options.keyboard) {
                this._keyboard.destroy(this);
            }

            return false;
        },

        show: function() {
            var self = this,
                obj;

            if (this.options.displayMode === 'inline') {
                if (this.options.onBeforeShow) {
                    this.options.onBeforeShow.apply(this);
                }
                this.picker.on('click.picker', function(e) {
                    self._click.call(self, e);
                });
            } else {
                if (this.showed === false) {
                    if (this.options.onBeforeShow) {
                        this.options.onBeforeShow.apply(this);
                    }
                    this.picker.removeClass(this.namespace + '_hide');
                    this.picker.addClass(this.namespace + '_show');
                    this._position();
                    this.showed = true;
                    $doc.on('click.' + this.flag, function(e) {
                        self._click.call(self, e);
                    });
                }
            }
            if (this.options.onShow) {
                this.options.onShow.apply(this);
            }
            return this;
        },
        hide: function() {
            if (this.showed === true) {
                if (this.options.onBeforeHide) {
                    this.options.onBeforeHide.apply(this);
                }
                this.selected = false;
                this.picker.removeClass(this.namespace + '_show');
                this.picker.addClass(this.namespace + '_hide');
                this.showed = false;

                $doc.off('click.' + this.flag);
                if (this.options.onHide) {
                    this.options.onHide.apply(this);
                }
            }
            return this;
        },
        prev: function(i, press) {
            var date = this.currentDate[i];
            switch (this.views[i]) {
                case 'days':
                    if (this.mode === 'multiple') {
                        if (press) {
                            if (this.focused === 0) {
                                for (var j = 0; j < this.options.calendars; j++) {
                                    this.currentDate[j].setMonth(this.currentMonth[j] - 1);
                                    this._updateDate(j);
                                    this._manageViews(j);
                                }
                            } else {
                                --this.focused;
                                this._manageViews(i);
                                this._manageViews(i - 1);
                            }
                        } else {
                            var prevMonthDays = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
                            if (this.focusDate.getDate() > prevMonthDays) {
                                this.focusDate.setDate(prevMonthDays);
                            }
                            this.focusDate.setMonth(this.focusDate.getMonth() - 1);
                            for (var k = 0; k < this.options.calendars; k++) {
                                this.currentDate[k].setMonth(this.currentMonth[k] - 1);
                                this._updateDate(k);
                                this._manageViews(k);
                            }
                        }
                        return false;
                    } else {
                        date.setMonth(this.currentMonth[i] - 1);
                        if (press) {
                            var prevMonthDays = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
                            if (this.focusDate[i].getDate() > prevMonthDays) {
                                this.focusDate[i].setDate(prevMonthDays);
                            }
                            this.focusDate[i] = new Date(date.getFullYear(), date.getMonth(), this.focusDate[i].getDate(), 0, 0, 0, 0);
                        }
                    }
                    break;
                case 'months':
                    date.setYear(this.currentYear[i] - 1);
                    if (press) {
                        this.focusDate[i] = new Date(date.getFullYear(), this.focusDate[i].getMonth(), this.focusDate[i].getDate(), 0, 0, 0, 0);
                    }
                    break;
                case 'years':
                    date.setYear(this.currentYear[i] - 12);
                    break;
            }
            this._updateDate(i);
            this._manageViews(i);
        },
        next: function(i, press) {
            var date = this.currentDate[i];
            switch (this.views[i]) {
                case 'days':
                    if (this.mode === 'multiple') {
                        if (press) {
                            if (this.focused === this.options.calendars - 1) {
                                for (var j = 0; j < this.options.calendars; j++) {
                                    this.currentDate[j].setMonth(this.currentMonth[j] + 1);
                                    this._updateDate(j);
                                    this._manageViews(j);
                                }
                            } else {
                                ++this.focused;
                                this._manageViews(i);
                                this._manageViews(i + 1);
                            }
                        } else {
                            var nextMonthDays = new Date(date.getFullYear(), date.getMonth() + 2, 0).getDate();
                            if (this.focusDate.getDate() > nextMonthDays) {
                                this.focusDate.setDate(nextMonthDays)
                            }
                            this.focusDate.setMonth(this.focusDate.getMonth() + 1);
                            for (var k = 0; k < this.options.calendars; k++) {
                                this.currentDate[k].setMonth(this.currentMonth[k] + 1);
                                this._updateDate(k);
                                this._manageViews(k);
                            }
                        }
                        return false;
                    } else {
                        date.setMonth(this.currentMonth[i] + 1);
                        if (press) {
                            var nextMonthDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                            if (this.focusDate[i].getDate() > nextMonthDays) {
                                this.focusDate[i].setDate(nextMonthDays)
                            }
                            this.focusDate[i] = new Date(date.getFullYear(), date.getMonth(), this.focusDate[i].getDate(), 0, 0, 0, 0);

                        }
                    }
                    break;
                case 'months':
                    date.setYear(this.currentYear[i] + 1);
                    if (press) {
                        this.focusDate[i] = new Date(date.getFullYear(), this.focusDate[i].getMonth(), this.focusDate[i].getDate(), 0, 0, 0, 0);
                    }
                    break;
                case 'years':
                    date.setYear(this.currentYear[i] + 12);
                    break;
            }
            this._updateDate(i);
            this._manageViews(i);
        },
        multipleClear: function() {
            this.selectedDate = [];
            for (var i = 0; i < this.options.calendars; i++) {
                this.manageViews(i);
            }
            this._setValue();
        },
        getWrap: function() {
            return this.picker;
        },
        getInput: function() {
            return this.$el;
        },
        getDate: function(format) {
            if (format === undefined) {
                return this.selectedDate;
            } else {
                var _format = this._parseFormat(format),
                    formated = [];
                for (var i = 0; i < this.selectedDate.length; i++) {
                    formated[i] = this._formatDate(this.selectedDate[i], _format);
                }
                return formated;
            }
        },
        destroy: function() {
            this.$el.removeData('datepicker');
            this.picker.remove();

            if (this.options.displayMode === 'inline') {
                this.picker.off('click.picke');
            } else {
                $doc.off('click.' + this.flag);
            }

            this.$el.off('focus');
            this.$el.off('blur');
        },
        update: function(_options) {
            if (typeof _options !== 'undefined') {
                for (var x in _options) {
                    this.options[x] = _options[x];
                }
            }
            this.destroy();
            this._init();
        }
    };

    $.fn.datepicker = function(options) {
        if (typeof options === 'string') {
            var method = options;
            var method_arguments = arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : undefined;
            if (/^\_/.test(method)) {
                return false;
            } else if (/^(getWrap|getInput|getDate)$/.test(method)) {
                var api = this.first().data('datepicker');
                if (api && typeof api[method] === 'function') {
                    return api[method].apply(api, method_arguments);
                }
            } else {
                return this.each(function() {
                    var api = $.data(this, 'datepicker');
                    if (api && typeof api[method] === 'function') {
                        api[method].apply(api, method_arguments);
                    }
                });
            }
        } else {
            return this.each(function() {
                if (!$.data(this, 'datepicker')) {
                    $.data(this, 'datepicker', new Datepicker(this, options));
                }
            });
        }
    };

})(jQuery);
