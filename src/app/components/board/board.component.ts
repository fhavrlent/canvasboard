import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  Renderer2
} from '@angular/core';
import { Pages } from '../../../interfaces/pages';
import { Tracking } from '../../../interfaces/tracking';
import { log } from 'util';
declare const pdfjsLib: any;
@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  constructor(public renderer: Renderer2) {
    this.getScreenSize();
  }

  // referring the canvas element
  @ViewChild('myCanvas', null) canvas: any;
  @ViewChild('backgroundImage', null) background: any;

  // Essentials
  canvasElement: any;
  backgroundCanvas: any;
  scrHeight: any;
  scrWidth: any;
  globalListenFunc: () => void;
  mouseControl = false;
  page: number;
  notebook: Pages[] = [];
  // for PDF.js
  pdfJs: any;
  numberOfPages: any;
  // PDF tracking
  pageTracking: Tracking[] = [];
  isPdfAdded = false;
  // content declarations
  ctx: any;

  // fileUpload
  filePath: string;

  // tools
  penColour: any = 'rgba(0,0,0)';
  penWidth = 1;
  defaultWidth = 1;
  defaultComposite = 'source-over';

  // basic_tools booleans
  basicTools = {
    normalPen: false,
    brushPen: false,
    highlighter: false,
    eraser: false
  };

  // # toolbox declarations
  // ## Normal pen
  normalPenStartX: number;
  normalPenStartY: number;
  normalPenCurrentX: number;
  normalPenCurrentY: number;
  normalPenEndX: number;
  normalPenEndY: number;
  normalPenWidth: number;
  normalPenColor: any;
  normalPenComposite: string;

  calligraphyTool = {
    calligraphy_startX: -1,
    calligraphy_startY: -1,
    calligraphy_currentX: -1,
    calligraphy_currentY: -1,
    calligraphy_endX: -1,
    calligraphy_endY: -1
  };
  highlighterTool = {
    highlighter_startX: -1,
    highlighter_startY: -1,
    highlighter_currentX: -1,
    highlighter_currentY: -1,
    highlighter_endX: -1,
    highlighter_endY: -1
  };
  eraserTool = {
    width: 20,
    color: 'rgba(1,0,0)',
    composite: 'destination-out'
  };

  localUrl: any[];

  // getting screen Width and height automatically triggers when dimension changes
  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    this.scrHeight = window.innerHeight;
    this.scrWidth = window.innerWidth - 220;
  }

  ngOnInit() {
    this.page = 0;
    console.log(
      'Screen width :',
      this.scrWidth,
      'Screen height',
      this.scrHeight
    );

    // getting the 2D context of Canvas element
    this.canvasElement = this.canvas.nativeElement;
    this.ctx = this.canvasElement.getContext('2d');
    // setting the Width and Height to the canvas element
    this.renderer.setAttribute(this.canvasElement, 'width', this.scrWidth);
    this.renderer.setAttribute(this.canvasElement, 'height', this.scrHeight);

    // for background
    this.backgroundCanvas = this.background.nativeElement;
    this.renderer.setAttribute(this.backgroundCanvas, 'width', this.scrWidth);
    this.renderer.setAttribute(this.backgroundCanvas, 'height', this.scrHeight);
  }

  addPdf(pageNumber) {
    this.pdfJs.promise.then((doc) => {
      console.log('PDF LOADED');
      console.log('THis pdf has ', doc._pdfInfo.numPages);
      // this.no_of_pages = doc._pdfInfo.numPages

      doc.getPage(pageNumber).then((page) => {
        const canvas: any = document.getElementById('my_canvas');
        const context: any = canvas.getContext('2d');
        const viewport: any = page.getViewport({ scale: 1.3 });
        viewport.height = this.scrHeight;
        this.isPdfAdded = true;
        // viewport.width = '200px';
        page.render({
          canvasContext: context,
          viewport
        });
      });
    });
  }

  // Enabling <selectedTool> and disabling other tools
  enableTool(selectedTool: string) {
    Object.keys(this.basicTools).forEach((key) => {
      this.basicTools[key] = false;
    });
    this.basicTools[selectedTool] = true;

    // Enable size button to Eraser tool.
    if (this.basicTools.eraser) {
      this.enableSizeButtons();
    } else {
      this.disableSizeButtons();
    }
  }

  // pen
  pen(
    penWidth: number = null,
    penColor: any = null,
    penComposite: string = null
  ) {
    // post checking
    if (this.basicTools.normalPen || this.basicTools.eraser) {
      // When mouse is pressed down
      this.globalListenFunc = this.renderer.listen(
        'document',
        'mousedown',
        (e) => {
          this.mouseControl = true;

          if (
            this.mouseControl &&
            (this.basicTools.normalPen || this.basicTools.eraser)
          ) {
            console.log('Mouse down');
            // taking mouse down X and Y coordinates
            this.normalPenStartX = e.offsetX;
            this.normalPenStartY = e.offsetY;
            this.normalPenWidth = penWidth ? penWidth : this.defaultWidth;
            this.normalPenColor = penColor ? penColor : this.penColour;
            this.normalPenComposite = penComposite
              ? penComposite
              : this.defaultComposite;
          }
        }
      );

      // When Mouse is moving
      this.globalListenFunc = this.renderer.listen(
        'document',
        'mousemove',
        (e) => {
          if (
            this.mouseControl &&
            (this.basicTools.normalPen || this.basicTools.eraser)
          ) {
            console.log('Mouse is moving! for pen');

            this.normalPenCurrentX = e.offsetX;
            this.normalPenCurrentY = e.offsetY;

            this.ctx.beginPath();
            this.ctx.moveTo(this.normalPenStartX, this.normalPenStartY);
            this.ctx.lineTo(this.normalPenCurrentX, this.normalPenCurrentY);
            this.ctx.closePath();
            this.ctx.strokeStyle = this.normalPenColor;
            this.ctx.lineWidth = this.normalPenWidth;
            this.ctx.globalCompositeOperation = this.normalPenComposite;
            this.ctx.stroke();

            // console.log(e,"Mouse move");
            this.normalPenStartX = this.normalPenCurrentX;
            this.normalPenStartY = this.normalPenCurrentY;
          }
        }
      );

      // When mouse is moved up
      this.globalListenFunc = this.renderer.listen(
        'document',
        'mouseup',
        (e) => {
          this.mouseControl = false;
          console.log('Mouse up');
          this.normalPenEndX = e.offsetX;
          this.normalPenEndY = e.offsetY;
        }
      );
    }
  }

  calligraphyButton() {
    console.log('Brush is working');
    this.enableTool('brushPen');

    if (this.basicTools.brushPen) {
      this.globalListenFunc = this.renderer.listen(
        'document',
        'mousedown',
        (e) => {
          this.mouseControl = true;

          if (this.mouseControl && this.basicTools.brushPen) {
            // taking mouse down X and Y coordinates
            console.log('Mouse down');
            this.calligraphyTool.calligraphy_startX = e.offsetX;
            this.calligraphyTool.calligraphy_startY = e.offsetY;
          }
        }
      );

      this.globalListenFunc = this.renderer.listen(
        'document',
        'mousemove',
        (e) => {
          if (this.mouseControl && this.basicTools.brushPen) {
            console.log('Mouse is moving for brish');

            this.calligraphyTool.calligraphy_currentX = e.offsetX;
            this.calligraphyTool.calligraphy_currentY = e.offsetY;

            this.ctx.beginPath();
            this.ctx.moveTo(
              this.calligraphyTool.calligraphy_startX,
              this.calligraphyTool.calligraphy_startY
            );
            this.ctx.lineTo(
              this.calligraphyTool.calligraphy_currentX,
              this.calligraphyTool.calligraphy_currentY
            );
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.strokeStyle = this.penColour;
            this.ctx.lineWidth = this.penWidth;
            this.ctx.globalCompositeOperation = this.defaultComposite;

            for (let i = 0; i < 5; i++) {
              this.ctx.beginPath();
              this.ctx.moveTo(
                this.calligraphyTool.calligraphy_startX + i,
                this.calligraphyTool.calligraphy_startY + i
              );
              this.ctx.lineTo(
                this.calligraphyTool.calligraphy_currentX + i,
                this.calligraphyTool.calligraphy_currentY + i
              );
              this.ctx.closePath();
              this.ctx.stroke();

              this.ctx.beginPath();
              this.ctx.moveTo(
                this.calligraphyTool.calligraphy_startX - i,
                this.calligraphyTool.calligraphy_startY - i
              );
              this.ctx.lineTo(
                this.calligraphyTool.calligraphy_currentX - i,
                this.calligraphyTool.calligraphy_currentY - i
              );
              this.ctx.closePath();
              this.ctx.stroke();
            }

            this.calligraphyTool.calligraphy_startX = this.calligraphyTool.calligraphy_currentX;
            this.calligraphyTool.calligraphy_startY = this.calligraphyTool.calligraphy_currentY;
          }
        }
      );

      // When mouse is moved up
      this.globalListenFunc = this.renderer.listen(
        'document',
        'mouseup',
        (e) => {
          this.mouseControl = false;
          console.log('Mouse up');
          this.calligraphyTool.calligraphy_endX = e.offsetX;
          this.calligraphyTool.calligraphy_endY = e.offsetY;
        }
      );
    }
  }

  penButton() {
    this.enableTool('normalPen');
    this.pen();
  }

  eraserButton() {
    this.enableTool('eraser');
    this.pen(
      this.eraserTool.width,
      this.eraserTool.color,
      this.eraserTool.composite
    );
  }

  setSize(size: number) {
    this.pen(size, this.eraserTool.color, this.eraserTool.composite);
  }

  disableButton(id: string) {
    (document.getElementById(id) as HTMLInputElement).disabled = true;
  }

  enableButton(id: string) {
    (document.getElementById(id) as HTMLInputElement).disabled = false;
  }

  disableSizeButtons() {
    this.disableButton('btn-size-1');
    this.disableButton('btn-size-10');
    this.disableButton('btn-size-20');
    this.disableButton('btn-size-50');
  }

  enableSizeButtons() {
    this.enableButton('btn-size-1');
    this.enableButton('btn-size-10');
    this.enableButton('btn-size-20');
    this.enableButton('btn-size-50');
  }

  highlighterButton() {
    console.log('Brush is working');
    this.enableTool('highlighter');

    if (this.basicTools.highlighter) {
      this.globalListenFunc = this.renderer.listen(
        'document',
        'mousedown',
        (e) => {
          this.mouseControl = true;

          if (this.mouseControl && this.basicTools.highlighter) {
            // taking mouse down X and Y coordinates
            console.log('Mouse down');
            this.highlighterTool.highlighter_startX = e.offsetX;
            this.highlighterTool.highlighter_startY = e.offsetY;
          }
        }
      );

      this.globalListenFunc = this.renderer.listen(
        'document',
        'mousemove',
        (e) => {
          if (this.mouseControl && this.basicTools.highlighter) {
            console.log('Mouse is moving for brish');

            this.highlighterTool.highlighter_currentX = e.offsetX;
            this.highlighterTool.highlighter_currentY = e.offsetY;

            this.ctx.globalCompositeOperation = this.defaultComposite;
            this.ctx.beginPath();
            this.ctx.moveTo(
              this.highlighterTool.highlighter_startX,
              this.highlighterTool.highlighter_startY
            );
            this.ctx.lineTo(
              this.highlighterTool.highlighter_currentX,
              this.highlighterTool.highlighter_currentY
            );
            this.ctx.closePath();
            this.ctx.stroke();

            for (let i = 0; i < 5; i++) {
              this.ctx.beginPath();
              this.ctx.moveTo(
                this.highlighterTool.highlighter_startX + i,
                this.highlighterTool.highlighter_startY + i
              );
              this.ctx.lineTo(
                this.highlighterTool.highlighter_currentX + i,
                this.highlighterTool.highlighter_currentY + i
              );
              this.ctx.closePath();
              this.ctx.stroke();
              this.ctx.strokeStyle = 'rgb(58,150,270)';
              this.ctx.lineWidth = 10;

              this.ctx.beginPath();
              this.ctx.moveTo(
                this.highlighterTool.highlighter_startX - i,
                this.highlighterTool.highlighter_startY - i
              );
              this.ctx.lineTo(
                this.highlighterTool.highlighter_currentX - i,
                this.highlighterTool.highlighter_currentY - i
              );
              this.ctx.closePath();
              this.ctx.stroke();
              this.ctx.strokeStyle = 'rgb(58,150,270)';
              this.ctx.lineWidth = 10;
            }

            this.highlighterTool.highlighter_startX = this.highlighterTool.highlighter_currentX;
            this.highlighterTool.highlighter_startY = this.highlighterTool.highlighter_currentY;
          }
        }
      );

      // When mouse is moved up
      this.globalListenFunc = this.renderer.listen(
        'document',
        'mouseup',
        (e) => {
          this.mouseControl = false;
          console.log('Mouse up');
          this.highlighterTool.highlighter_endX = e.offsetX;
          this.highlighterTool.highlighter_endY = e.offsetY;
        }
      );
    }
  }

  showPreviewImage(event: any) {
    // checking if file is uploading
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (readerEvent: any) => {
        this.localUrl = readerEvent.target.result;
        this.pdfJs = pdfjsLib.getDocument(this.localUrl);

        this.pdfJs.promise.then((doc) => {
          console.log('PDF LOADED');
          console.log('This pdf has ', doc._pdfInfo.numPages);
          this.numberOfPages = doc._pdfInfo.numPages;

          // once the whole file is uploaded
          // this.function_PDF_tracking(this.no_of_pages)
          this.addPdf(1);
        });
      };
      reader.readAsDataURL(event.target.files[0]);
      console.log('Local URL', this.localUrl);
    }
  }

  function_PDF_tracking(num) {
    // setting up pdf tracking
    for (let i = 0; i < num; i++) {
      console.log(i);

      // by default 1st page is visited
      if (i === 0) {
        const obj: {
          page: number;
          status: string;
        } = null;
        obj.page = i + 1;
        obj.status = 'visited';

        // this.pageTracking.push(obj)
      } else {
        const obj = {
          page: i + 1,
          status: 'novisit'
        };

        // this.pageTracking.push(obj)
      }
    }
  }

  async nextPage() {
    // save the state
    const present = {
      pageNumber: this.page,
      image: this.canvasElement.toDataURL(),
      // check if that page number is there or notement.toDataURL(),
      date: Date.now()
    };

    console.log(present, 'Added to my notebook');
    // checking if that page number is there or not
    // if found then update else append
    this.upsert(this.notebook, this.page, present);
    this.pdfTick(this.pageTracking, this.page);
    // Going to new page
    console.log('Stored page number', this.page);

    // new page configurations
    this.page = this.page + 1;
    console.log('New page number', this.page);

    // clearing my rect
    this.ctx.clearRect(0, 0, this.scrWidth, this.scrHeight);
    this.ctx.globalCompositeOperation = this.defaultComposite;

    if (this.isPdfAdded) {
      // if pdf page is already rendered then don't add.. else add the pdf
      const temp = this.pageTracking.findIndex(
        (item) => item.pageNumber === this.page
      );
      if (temp > -1) {
        // page number is already there in page tracking
        console.log('Page number found in tracking list so not adding');
      } else {
        console.log(
          'As page number is not found in tracking list we are adding it'
        );

        await this.addPdf(this.page + 1);
      }
    }

    // for(let i=0;i<this.pageTracking.length;i++){
    //   //page is already rendered
    //   if(this.page<=this.pageTracking.length){
    //     console.log("Not adding");
    //   }
    //   else{
    //     await this.addPdf(this.page+1)
    //   }
    // }

    // if it already exists append
    if (this.notebook[this.page]) {
      console.log('Loading page', this.page);

      // this.ctx.clearRect(0, 0, this.scrWidth, this.scrHeight);
      const image = new Image();

      image.onload = (event) => {
        this.ctx.clearRect(0, 0, this.scrWidth, this.scrHeight);
        console.log('Image width', image.width);
        image.width = this.scrWidth;

        this.ctx.drawImage(image, 0, 0); // draw the new image to the screen
      };
      image.src = this.notebook[this.page].image;
    }

    console.log('Man at end', this.notebook);
  }
  prevPage() {
    if (this.page > 0) {
      // save the state
      const present = {
        pageNumber: this.page,
        image: this.canvasElement.toDataURL(),
        // check if that page number is there or notement.toDataURL(),
        date: Date.now()
      };

      // adding it to the tracking list as this page is visited
      this.pdfTick(this.pageTracking, this.page);

      // checking if that page number is there or not
      // if found then update else append
      this.upsert(this.notebook, this.page, present);
      console.log('Storing the page number which prev is pressed', present);

      console.log(this.notebook);

      this.page = this.page - 1;
      const image = new Image();

      image.onload = (event) => {
        this.ctx.clearRect(0, 0, this.scrWidth, this.scrHeight);
        this.ctx.drawImage(image, 0, 0); // draw the new image to the screen
        this.ctx.globalCompositeOperation = this.defaultComposite;
      };
      image.src = this.notebook[this.page].image;

      // for (let index = 0; index < this.notebook.length; index++) {
      //   if(this.page){
      //     var image = new Image();
      //     image.onload = (event) => {
      //       this.ctx.clearRect(0, 0, this.scrWidth, this.scrHeight);
      //       this.ctx.drawImage(image, 0, 0); // draw the new image to the screen
      //     }
      //     image.src = this.notebook[index].image; // data.image contains the data URL

      //     console.log(image);

      //   }
      // }

      console.log(this.page);
    }

    console.log('Man at end', this.notebook);
  }
  pdfTick(array, pageNumber) {
    if (pageNumber <= this.numberOfPages) {
      const i = array.findIndex((item) => item.pageNumber === pageNumber);
      if (i > -1) {
      } else {
        const obj = {
          pageNumber,
          status: 'visited'
        };
        array.push(obj);
        console.log('PDF TRACKING', obj);
      } // page not found

      console.log('My final Array', this.pageTracking);
    }
  }

  upsert(array, pageNumber, obj) {
    const i = array.findIndex((item) => item.pageNumber === pageNumber);
    if (i > -1) {
      array[i] = obj;
      console.log('Found page numberr');
    } else {
      array.push(obj);
      console.log('New page!!');
    } // adding new page number
  }

  downloadAsJSON() {
    const present = {
      pageNumber: this.page,
      image: this.canvasElement.toDataURL(),
      date: Date.now()
    };

    this.upsert(this.notebook, this.page, present);

    const data =
      'text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(this.notebook));
    const a = document.createElement('a');
    a.href = 'data:' + data;
    a.download = 'data.json';
    a.innerHTML = 'download JSON';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Add normal paper
  addRuledPaper() {
    let ctx: any = document.getElementById('backgroundImage');
    if (ctx.getContext) {
      ctx = ctx.getContext('2d');
      const img1 = new Image();
      img1.onload = (event) => {
        // draw background image
        console.log(img1.width);
        img1.width = 1000;
        img1.height = 1000;

        ctx.drawImage(img1, 0, 0, this.scrWidth, this.scrHeight);
      };
      img1.src =
        'https://github.com/Canvasbird/canvasboard/blob/master/src/assets/College-Ruled-Papers-Template-A4-Size-650x823.png?raw=true';
    }
  }

  // Add math paper
  addMathPaper() {
    let ctx: any = document.getElementById('backgroundImage');
    if (ctx.getContext) {
      ctx = ctx.getContext('2d');
      const img1 = new Image();
      img1.onload = (event) => {
        // draw background image
        console.log(img1.width);
        // img1.width = 1000
        // img1.height = 1000

        ctx.drawImage(img1, 0, 0, this.scrWidth, this.scrHeight);
      };
      img1.src =
        'https://raw.githubusercontent.com/Canvasbird/canvasboard/master/src/assets/paperType/mathYellow.svg';
    }
  }

  // Add graph paper
  addGraphPaper() {
    let ctx: any = document.getElementById('backgroundImage');
    if (ctx.getContext) {
      ctx = ctx.getContext('2d');
      const img1 = new Image();
      img1.onload = (event) => {
        // draw background image
        console.log(img1.width);
        // img1.width = 1000
        // img1.height = 1000

        ctx.drawImage(img1, 0, 0, this.scrWidth, this.scrHeight);
      };
      img1.src =
        'https://github.com/Canvasbird/canvasboard/blob/master/src/assets/paperType/graph.png?raw=true';
    }
  }

  colourPick(opacity = 1) {
    const data: any = document.getElementById('myColor');

    // changing the value to RGB format
    // #XXXXXX -> ["XX", "XX", "XX"]
    let value = data.value.match(/[A-Za-z0-9]{2}/g);
    // ["XX", "XX", "XX"] -> [n, n, n]
    value = value.map((v) => parseInt(v, 16));
    // [n, n, n] -> rgb(n,n,n)
    const rgbConverted = 'rgb(' + value.join(',') + ',' + opacity + ')';
    this.penColour = rgbConverted;
  }

  // changing the value to RGB format
  rgbConverter = (hexValue, opacity = 1) =>
    'rgb(' +
    hexValue
      .match(/[A-Za-z0-9]{2}/g)
      .value.map((v) => parseInt(v, 16))
      .join(',') +
    ',' +
    opacity +
    ')';
}
