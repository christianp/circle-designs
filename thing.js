console.clear();

function createElement(name,attr) {
	var e = document.createElementNS("http://www.w3.org/2000/svg",name);
	for(var key in attr) {
	e.setAttribute(key,attr[key]);
	}
	return e;
}

function make_transcript(prob_descend,depth,max_depth) {
	var o = '';
	for(var i=0;i<4;i++) {
	if(depth<max_depth && Math.random()<prob_descend) {
		o += 'd'+make_transcript(prob_descend,depth+1,max_depth);
	} else {
		o += 'c';
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
	if(transcript[0]=='c') {
		var path = createElement('path',{class:'arc',d:'M '+d.x1+' '+d.y1+' a '+r+' '+r+' 0 0 1 '+d.dx+' '+d.dy+' L '+x+' '+y+' z'});
		g.appendChild(path);
		transcript = transcript.slice(1);
	} else if(transcript[0]=='d') {
		transcript = transcript.slice(1);
		transcript = circle(g,d.cx,d.cy,r/2,transcript);
	}
	})
	return transcript;
}

var svg = document.getElementById('place')
function draw(transcripts) {
	svg.innerHTML = '';
	transcripts.forEach(function(transcript) {
	var g = createElement('g',{class:'arcs'})
	g.style['fill'] = transcript.colour;
	svg.appendChild(g);
	circle(g,0.5,0.5,0.5,transcript.path);
	});
	set_blend();

	options.transcripts = transcripts.map(function(t){return t.path+'::'+t.colour}).join(';');
	set_link();
}

function set_link() {
	document.getElementById('transcripts').href = location.origin+location.pathname+'?'+makeSearchParams(options);
}

var options = {
	num_layers: 3,
	prob_descend: 0.4,
	max_depth: 8,
	blend_mode: 'normal'
}

function make_transcripts() {
	var transcripts = [];
	for(var i=0;i<options.num_layers;i++) {
	transcripts.push({
		path: make_transcript(options.prob_descend,0,options.max_depth),
		colour: 'hsl('+Math.floor(Math.random()*360)+',50%,50%)'
	});
	}
	return transcripts;
}

function generate() {
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
	var transcripts = obj.transcripts.split(';').map(function(ts) {
		var bits = ts.split('::');
		return {path: bits[0], colour: bits[1]};
	});
	draw(transcripts);
} else {
	generate();
}

[{name:'blend_mode',fn:set_blend},{name:'prob_descend',fn:generate},{name:'max_depth',fn:generate},{name:'num_layers',fn:generate}].forEach(make_control);

