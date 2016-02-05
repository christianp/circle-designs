var svg = document.getElementById('place')
var design_g = svg.querySelector('.design');
var draw_queue = [];
var fullscreen = false;
var draw_speed = 0.05;
var prob_regenerate = 0.01;
var min_display = 10000;
var done_time = null;

function createElement(name,attr) {
	var e = document.createElementNS("http://www.w3.org/2000/svg",name);
	for(var key in attr) {
	e.setAttribute(key,attr[key]);
	}
	return e;
}

function make_transcript(prob_descend,prob_nothing,depth,max_depth) {
	var o = '';
	for(var i=0;i<4;i++) {
		if(Math.random()>prob_nothing) {
			if(depth<max_depth && Math.random()<prob_descend) {
				o += 'd'+make_transcript(prob_descend,prob_nothing,depth+1,max_depth);
			} else {
				o += 'c';
			}
		} else {
			o += 'n';
		}
	}
	return o;
}

function circle(g,x,y,r,transcript) {
	var points = [
		{cx:x+r/2,cy:y+r/2,x1:x+r,y1:y,dx:-r,dy:r},
		{cx:x-r/2,cy:y+r/2,x1:x,y1:y+r,dx:-r,dy:-r},
		{cx:x-r/2,cy:y-r/2,x1:x-r,y1:y,dx:r,dy:-r},
		{cx:x+r/2,cy:y-r/2,x1:x,y1:y-r,dx:r,dy:r}
	]
	points.forEach(function(d) {
		var letter = transcript[0];
		transcript = transcript.slice(1);
		if(letter=='c') {
			var path = createElement('path',{class:'arc',d:'M '+d.x1+' '+d.y1+' a '+r+' '+r+' 0 0 1 '+d.dx+' '+d.dy+' L '+x+' '+y+' z'});
			draw_queue.push({element:path,g:g});
		} else if(letter=='d') {
			transcript = circle(g,d.cx,d.cy,r/2,transcript);
		} else if(letter=='n') {
		}
	})
	return transcript;
}

function draw(transcripts) {
	design_g.innerHTML = '';
	draw_queue = [];
	transcripts.forEach(function(transcript) {
		var g = createElement('g',{class:'arcs'})
		g.style['fill'] = transcript.colour;
		design_g.appendChild(g);
		circle(g,0.5,0.5,0.5,transcript.path);
	});
	set_blend();

	options.transcripts = transcripts.map(function(t){return t.path+'::'+t.colour}).join(';');
	set_link();
}


function do_queue() {
	if(draw_queue.length==0) {
		if((options.auto_generate || fullscreen) && (new Date())-done_time>min_display && Math.random()<prob_regenerate) {
			generate();
		}
		return;
	}
	var n = draw_queue.length;
	for(var j=0;j<Math.max(n*draw_speed,1);j++) {
		var i = Math.floor(Math.random()*draw_queue.length);
		var item = draw_queue.splice(i,1)[0];
		item.g.appendChild(item.element);
	}
}
setInterval(do_queue,50);

function set_link() {
	document.getElementById('transcripts').href = location.origin+location.pathname+'?'+makeSearchParams(options);
	var download = document.getElementById('download');
	download.download = 'circles.svg';
	download.href = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg.outerHTML);
}

var options = {
	num_layers: 3,
	prob_descend: 0.4,
	prob_nothing: 0.1,
	max_depth: 8,
	blend_mode: 'normal',
	auto_generate: false
}

function make_transcripts() {
	var transcripts = [];
	for(var i=0;i<options.num_layers;i++) {
	transcripts.push({
		path: make_transcript(options.prob_descend,options.prob_nothing,0,options.max_depth),
		colour: 'hsl('+Math.floor(Math.random()*360)+',50%,50%)'
	});
	}
	return transcripts;
}

function generate() {
	done_time = new Date();
	var transcripts = make_transcripts();
	draw(transcripts);
}

function set_blend() {
	var arcs = svg.querySelectorAll('.arcs');
	for(var i=0;i<arcs.length;i++) {
		arcs[i].style['mix-blend-mode'] = options.blend_mode;
	}
	set_link();
}

function make_control(data) {
	var name = data.name;
	document.getElementById(name).addEventListener('change',function(e) {
		options[name] = document.getElementById(name).value;
		data.fn();
	});
	document.getElementById(name).value = options[name];
}

document.getElementById('draw').addEventListener('click',generate);

function getSearchParams() {
	var search = location.search.slice(1);
	var bits = search.split('&');
	var obj = {};
	var re_component = /^(?:(\w+)=)?(.*)$/;
	for(var i=0;i<bits.length;i++) {
		var m = re_component.exec(bits[i]);
		var name = decodeURIComponent(m[1] || '_query');
		var value = decodeURIComponent(m[2]);
		obj[name] = value;
	}
	return obj;
}

function makeSearchParams(obj) {
	var query = [];
	for(var key in obj) {
		query.push(encodeURIComponent(key)+'='+encodeURIComponent(obj[key]));
	}
	return query.join('&');
}


if(location.search.length) {
	var obj = getSearchParams();
	for(var key in obj) {
		options[key] = obj[key];
	}
	options.auto_generate = options.auto_generate == 'true';
	var transcripts = obj.transcripts.split(';').map(function(ts) {
		var bits = ts.split('::');
		return {path: bits[0], colour: bits[1]};
	});
	draw(transcripts);
} else {
	generate();
}

[
	{name:'blend_mode',fn:set_blend},
	{name:'prob_descend',fn:generate},
	{name:'prob_nothing',fn:generate},
	{name:'max_depth',fn:generate},
	{name:'num_layers',fn:generate},
	{name: 'auto_generate',fn:(function(){})}
].forEach(make_control);

function toggleFullScreen() {
	var container = document.documentElement;
	if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
		if (container.requestFullscreen) {
			container.requestFullscreen();
		} else if (container.msRequestFullscreen) {
			container.msRequestFullscreen();
		} else if (container.mozRequestFullScreen) {
			container.mozRequestFullScreen();
		} else if (container.webkitRequestFullscreen) {
			container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	}
}

function exit_full_screen(e) {
	if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
		document.documentElement.classList.remove('fullscreen');
		fullscreen = false;
	} else {
		document.documentElement.classList.add('fullscreen');
		fullscreen = true;
	}
}
document.documentElement.addEventListener('webkitfullscreenchange',exit_full_screen);
document.documentElement.addEventListener('mozfullscreenchange',exit_full_screen);
document.documentElement.addEventListener('fullscreenchange',exit_full_screen);

document.getElementById('fullscreen').addEventListener('click',function() {
	toggleFullScreen();
});
