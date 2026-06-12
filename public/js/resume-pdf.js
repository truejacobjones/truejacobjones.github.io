(function () {
  var JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';

  function parseRichText(html) {
    var segments = [];
    var regex = /<b>(.*?)<\/b>/g;
    var lastIndex = 0;
    var match;
    while ((match = regex.exec(html)) !== null) {
      if (match.index > lastIndex)
        segments.push({ text: html.slice(lastIndex, match.index), bold: false });
      segments.push({ text: match[1], bold: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < html.length)
      segments.push({ text: html.slice(lastIndex), bold: false });
    return segments;
  }

  function renderRichText(doc, html, x, y, maxWidth, fontSize) {
    doc.setFontSize(fontSize);
    var lineHeight = fontSize * 0.45;
    var segments = parseRichText(html);
    var tokens = [];
    for (var s = 0; s < segments.length; s++) {
      var words = segments[s].text.split(/\s+/).filter(function (w) { return w.length > 0; });
      for (var w = 0; w < words.length; w++)
        tokens.push({ text: words[w], bold: segments[s].bold });
    }

    var curX = x;
    var curY = y;
    for (var i = 0; i < tokens.length; i++) {
      doc.setFont('helvetica', tokens[i].bold ? 'bold' : 'normal');
      var wordW = doc.getTextWidth(tokens[i].text);
      var spaceW = doc.getTextWidth(' ');
      var needed = (i === 0 ? 0 : spaceW) + wordW;

      if (curX + needed > x + maxWidth && curX > x) {
        curX = x;
        curY += lineHeight;
      }
      if (i > 0 && curX > x) curX += spaceW;
      doc.text(tokens[i].text, curX, curY);
      curX += wordW;
    }
    return curY + lineHeight;
  }

  function checkBreak(doc, y, needed, mt, mb, ph) {
    if (y + needed > ph - mb) {
      doc.addPage();
      return mt;
    }
    return y;
  }

  function generateResume(data) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'letter' });

    var pw = 215.9, ph = 279.4;
    var ml = 15, mr = 15, mt = 12, mb = 12;
    var cw = pw - ml - mr;
    var y = mt;

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(data.name, pw / 2, y, { align: 'center' });
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      data.location + '  |  ' + data.email + '  |  ' + data.website,
      pw / 2, y, { align: 'center' }
    );
    y += 5;

    doc.setDrawColor(60);
    doc.setLineWidth(0.5);
    doc.line(ml, y, pw - mr, y);
    y += 6;

    function sectionHeader(title) {
      y = checkBreak(doc, y, 15, mt, mb, ph);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(50);
      doc.text(title.toUpperCase(), ml, y);
      y += 1;
      doc.setDrawColor(150);
      doc.setLineWidth(0.3);
      doc.line(ml, y, pw - mr, y);
      y += 5;
      doc.setTextColor(0);
    }

    // --- Work Experience ---
    sectionHeader('Work Experience');

    for (var j = 0; j < data.experience.length; j++) {
      var job = data.experience[j];
      y = checkBreak(doc, y, 25, mt, mb, ph);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(job.title, ml, y);
      var tw = doc.getTextWidth(job.title);
      doc.setFont('helvetica', 'normal');
      doc.text(' — ' + job.company, ml + tw, y);

      doc.setFontSize(9);
      doc.text(job.start + ' – ' + job.end, pw - mr, y, { align: 'right' });
      y += 4;

      if (job.description) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text(job.description, ml, y);
        y += 4;
      }

      for (var h = 0; h < job.highlights.length; h++) {
        y = checkBreak(doc, y, 8, mt, mb, ph);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('•', ml + 2, y);
        y = renderRichText(doc, job.highlights[h], ml + 6, y, cw - 6, 9);
      }
      y += 3;
    }

    // --- Projects ---
    sectionHeader('Projects');

    for (var p = 0; p < data.projects.length; p++) {
      var proj = data.projects[p];
      y = checkBreak(doc, y, 20, mt, mb, ph);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(proj.title, ml, y);
      if (proj.name) {
        var ptw = doc.getTextWidth(proj.title);
        doc.setFont('helvetica', 'normal');
        doc.text(' — ' + proj.name, ml + ptw, y);
      }
      if (proj.date) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(proj.date, pw - mr, y, { align: 'right' });
      }
      y += 4;

      if (proj.description) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text(proj.description, ml, y);
        y += 4;
      }

      for (var ph2 = 0; ph2 < proj.highlights.length; ph2++) {
        y = checkBreak(doc, y, 8, mt, mb, ph);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('•', ml + 2, y);
        y = renderRichText(doc, proj.highlights[ph2], ml + 6, y, cw - 6, 9);
      }
      y += 3;
    }

    // --- Education ---
    sectionHeader('Education');

    for (var e = 0; e < data.education.length; e++) {
      var edu = data.education[e];
      y = checkBreak(doc, y, 15, mt, mb, ph);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(edu.school, ml, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      var eduLine = edu.degree;
      if (edu.gpa) eduLine += '  |  GPA: ' + edu.gpa;
      doc.text(eduLine, ml, y);
      y += 4;
    }

    doc.save(data.name.replace(/\s+/g, '_') + '_Resume.pdf');
  }

  function loadJsPDF(cb) {
    if (window.jspdf) return cb();
    var script = document.createElement('script');
    script.src = JSPDF_CDN;
    script.onload = cb;
    document.head.appendChild(script);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var link = document.getElementById('download-resume');
    if (!link) return;

    link.addEventListener('click', function (e) {
      e.preventDefault();
      link.textContent = 'Loading…';
      loadJsPDF(function () {
        generateResume(window.resumeData);
        link.textContent = 'Resume';
      });
    });
  });
})();
