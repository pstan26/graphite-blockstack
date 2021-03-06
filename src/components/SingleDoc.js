import React, { Component } from "react";
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Profile from "./Profile";
import Signin from "./Signin";
import Header from "./Header";
import {
  isSignInPending,
  isUserSignedIn,
  redirectToSignIn,
  handlePendingSignIn,
  signUserOut
} from "blockstack";
import update from 'immutability-helper';
const wordcount = require("wordcount");
const blockstack = require("blockstack");
const Quill = ReactQuill.Quill;
const Font = ReactQuill.Quill.import('formats/font');
Font.whitelist = ['Ubuntu', 'Raleway', 'Roboto', 'Lato', 'Open Sans', 'Montserrat'] ; // allow ONLY these fonts and the default
ReactQuill.Quill.register(Font, true);

export default class SingleDoc extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: [],
      textvalue : "",
      test:"",
      updated: "",
      words: "",
      index: "",
      save: "",
      loading: "hide",
      printPreview: false,
      autoSave: "Saved"
    }
    this.handleaddItem = this.handleaddItem.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.saveNewFile = this.saveNewFile.bind(this);
  }

  componentWillMount() {
    if (isSignInPending()) {
      handlePendingSignIn().then(userData => {
        window.location = window.location.origin;
      });
    }
  }

  componentDidMount() {
    blockstack.getFile("documents.json", true)
     .then((fileContents) => {
        this.setState({ value: JSON.parse(fileContents || '{}').value })
        console.log("loaded");
     }).then(() =>{
       let value = this.state.value;
       const thisDoc = value.find((doc) => { return doc.id == this.props.match.params.id});
       let index = thisDoc && thisDoc.id;
       console.log(index);
       function findObjectIndex(doc) {
           return doc.id == index;
       }
       this.setState({ test: thisDoc && thisDoc.content, textvalue: thisDoc && thisDoc.title, index: value.findIndex(findObjectIndex) })
     })
      .catch(error => {
        console.log(error);
      });
      this.printPreview = () => {
        if(this.state.printPreview == true) {
          this.setState({printPreview: false});
        } else {
          this.setState({printPreview: true});
        }
      }
      setTimeout(this.handleAutoAdd,1000);
      this.refresh = setInterval(() => this.handleAutoAdd(), 3000);
    }


  handleTitleChange(e) {
    this.setState({
      textvalue: e.target.value
    });
  }
  handleChange(value) {
      this.setState({ test: value })
    }
  handleaddItem() {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const object = {};
    object.title = this.state.textvalue || "Untitled";
    object.content = this.state.test;
    object.id = parseInt(this.props.match.params.id);
    object.updated = month + "/" + day + "/" + year;
    object.words = wordcount(this.state.test);
    this.setState({ value: [...this.state.value, this.state.value.splice(this.state.index, 1, object)]})
    this.setState({ loading: "show", save: "hide" });
    this.saveNewFile();
    console.log(this.state);
  };

  saveNewFile() {
    this.setState({ loading: "show" });
    this.setState({ save: "hide"});
    blockstack.putFile("documents.json", JSON.stringify(this.state), true)
      .then(() => {
        console.log(JSON.stringify(this.state));
        this.setState({ loading: "hide" });
        location.href = '/';
      })
      .catch(e => {
        console.log("e");
        console.log(e);
        alert(e.message);
      });
  }

  handleAutoAdd() {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const object = {};
    object.title = this.state.textvalue || "Untitled";
    object.content = this.state.test;
    object.id = parseInt(this.props.match.params.id);
    object.updated = month + "/" + day + "/" + year;
    object.words = wordcount(this.state.test);
    const index = this.state.index;
    const updatedDoc = update(this.state.value, {$splice: [[index, 1, object]]});  // array.splice(start, deleteCount, item1)
    this.setState({value: updatedDoc});
    // this.setState({autoSave: true});
    console.log(this.state.value);
    this.autoSave();
  };

  autoSave() {
    this.setState({autoSave: "Saving"});
    blockstack.putFile("documents.json", JSON.stringify(this.state), true)
      .then(() => {
        console.log("Autosaved");
        this.setState({autoSave: "Saved"});
        // setState({autoSave: false});
      })
      .catch(e => {
        console.log("e");
        console.log(e);
        alert(e.message);
      });
  }

  print(){
    const curURL = window.location.href;
    history.replaceState(history.state, '', '/');
    window.print();
    history.replaceState(history.state, '', curURL);
  }

  renderView() {

    SingleDoc.modules = {
      toolbar: [
        [{ 'header': '1'}, {'header': '2'}, { 'font': Font.whitelist }],,
        [{size: []}],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'},
         {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image', 'video'],
        ['clean']
      ],
      clipboard: {
        // toggle to add extra line breaks when pasting HTML:
        matchVisual: false,
      }
    }
    /*
     * Quill editor formats
     * See https://quilljs.com/docs/formats/
     */
    SingleDoc.formats = [
      'header', 'font', 'size',
      'bold', 'italic', 'underline', 'strike', 'blockquote',
      'list', 'bullet', 'indent',
      'link', 'image', 'video'
    ]

    const words = wordcount(this.state.test);
    const loading = this.state.loading;
    const save = this.state.save;
    const autoSave = this.state.autoSave;
    var content = "<p style='text-align: center;'>" + this.state.textvalue + "</p>" + "<div style='text-indent: 30px;'>" + this.state.test + "</div>";

    var htmlString = $('<html xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">').html('<body>' +

    content +

    '</body>'

    ).get().outerHTML;

    var htmlDocument = '<html xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><xml><word:WordDocument><word:View>Print</word:View><word:Zoom>90</word:Zoom><word:DoNotOptimizeForBrowser/></word:WordDocument></xml></head><body>' + content + '</body></html>';
    var dataUri = 'data:text/html,' + encodeURIComponent(htmlDocument);

    if(this.state.printPreview === true) {
      return (
        <div>
        <div className="navbar-fixed toolbar">
          <nav className="toolbar-nav">
            <div className="nav-wrapper">
              <a href="/" className="brand-logo"><i className="material-icons">arrow_back</i></a>


                <ul className="left toolbar-menu">
                  <li><a onClick={this.printPreview}>Back to Editing</a></li>
                  <li><a onClick={this.print}><i className="material-icons">local_printshop</i></a></li>
                  <li><a download={this.state.textvalue + ".doc"}  href={dataUri}><img className="wordlogo" src="http://www.free-icons-download.net/images/docx-file-icon-71578.png" /></a></li>
                </ul>

            </div>
          </nav>
        </div>
        <div className="container docs">
          <div className="card doc-card">
            <div className="double-space doc-margin">
              <p className="center-align print-view">
              {this.state.textvalue}
              </p>
              <div>
                <div
                  className="print-view no-edit"
                  dangerouslySetInnerHTML={{ __html: this.state.test }}
                />
              </div>
              </div>
              </div>
        </div>

        </div>
      );
    } else {
      return (
        <div>
        <div className="navbar-fixed toolbar">
          <nav className="toolbar-nav">
            <div className="nav-wrapper">
              <a href="/" className="brand-logo"><i className="material-icons">arrow_back</i></a>


                <ul className="left toolbar-menu">
                <li><a onClick={this.printPreview}>Export Options</a></li>
                </ul>
                <ul className="right toolbar-menu auto-save">
                <li><a className="muted">{autoSave}</a></li>
                </ul>

            </div>
          </nav>
        </div>
          <div className="container docs">
            <div className="card doc-card">
              <div className="double-space doc-margin">
              <h4 className="align-left">
              <input className="print-title" placeholder="Title" type="text" value={this.state.textvalue} onChange={this.handleTitleChange} />
              </h4>

              <ReactQuill
                modules={SingleDoc.modules}
                formats={SingleDoc.formats}
                id="textarea1"
                className="materialize-textarea print-view"
                placeholder="Write something great"
                value={this.state.test}
                onChange={this.handleChange} />

              <div className="right-align wordcounter">
                <p className="wordcount">{words} words</p>
              </div>
              <div className={save}>
              </div>
              <div className={loading}>
              <div className="preloader-wrapper small active">
                <div className="spinner-layer spinner-green-only">
                  <div className="circle-clipper left">
                    <div className="circle"></div>
                  </div><div className="gap-patch">
                    <div className="circle"></div>
                  </div><div className="circle-clipper right">
                    <div className="circle"></div>
                  </div>
                </div>
              </div>
              </div>
              </div>
            </div>
          </div>
          </div>
      );
    }
  }

  render() {
    return (
      <div>
        {this.renderView()}
      </div>
    );
  }
}
