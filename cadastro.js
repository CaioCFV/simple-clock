(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      define(factory);
    } else if (typeof exports === 'object') {
      module.exports = factory();
    } else {
      root.VMasker = factory();
    }
  }(this, function() {
    var DIGIT = "9",
        ALPHA = "A",
        ALPHANUM = "S",
        BY_PASS_KEYS = [9, 16, 17, 18, 36, 37, 38, 39, 40, 91, 92, 93],
        isAllowedKeyCode = function(keyCode) {
          for (var i = 0, len = BY_PASS_KEYS.length; i < len; i++) {
            if (keyCode == BY_PASS_KEYS[i]) {
              return false;
            }
          }
          return true;
        },
        mergeMoneyOptions = function(opts) {
          opts = opts || {};
          opts = {
            precision: opts.hasOwnProperty("precision") ? opts.precision : 2,
            separator: opts.separator || ",",
            delimiter: opts.delimiter || ".",
            unit: opts.unit && (opts.unit.replace(/[\s]/g,'') + " ") || "",
            suffixUnit: opts.suffixUnit && (" " + opts.suffixUnit.replace(/[\s]/g,'')) || "",
            zeroCents: opts.zeroCents,
            lastOutput: opts.lastOutput
          };
          opts.moneyPrecision = opts.zeroCents ? 0 : opts.precision;
          return opts;
        },
        // Fill wildcards past index in output with placeholder
        addPlaceholdersToOutput = function(output, index, placeholder) {
          for (; index < output.length; index++) {
            if(output[index] === DIGIT || output[index] === ALPHA || output[index] === ALPHANUM) {
              output[index] = placeholder;
            }
          }
          return output;
        }
    ;
  
    var VanillaMasker = function(elements) {
      this.elements = elements;
    };
  
    VanillaMasker.prototype.unbindElementToMask = function() {
      for (var i = 0, len = this.elements.length; i < len; i++) {
        this.elements[i].lastOutput = "";
        this.elements[i].onkeyup = false;
        this.elements[i].onkeydown = false;
  
        if (this.elements[i].value.length) {
          this.elements[i].value = this.elements[i].value.replace(/\D/g, '');
        }
      }
    };
  
    VanillaMasker.prototype.bindElementToMask = function(maskFunction) {
      var that = this,
          onType = function(e) {
            e = e || window.event;
            var source = e.target || e.srcElement;
  
            if (isAllowedKeyCode(e.keyCode)) {
              setTimeout(function() {
                that.opts.lastOutput = source.lastOutput;
                source.value = VMasker[maskFunction](source.value, that.opts);
                source.lastOutput = source.value;
                if (source.setSelectionRange && that.opts.suffixUnit) {
                  source.setSelectionRange(source.value.length, (source.value.length - that.opts.suffixUnit.length));
                }
              }, 0);
            }
          }
      ;
      for (var i = 0, len = this.elements.length; i < len; i++) {
        this.elements[i].lastOutput = "";
        this.elements[i].onkeyup = onType;
        if (this.elements[i].value.length) {
          this.elements[i].value = VMasker[maskFunction](this.elements[i].value, this.opts);
        }
      }
    };
  
    VanillaMasker.prototype.maskMoney = function(opts) {
      this.opts = mergeMoneyOptions(opts);
      this.bindElementToMask("toMoney");
    };
  
    VanillaMasker.prototype.maskNumber = function() {
      this.opts = {};
      this.bindElementToMask("toNumber");
    };
    
    VanillaMasker.prototype.maskAlphaNum = function() {
      this.opts = {};
      this.bindElementToMask("toAlphaNumeric");
    };
  
    VanillaMasker.prototype.maskPattern = function(pattern) {
      this.opts = {pattern: pattern};
      this.bindElementToMask("toPattern");
    };
  
    VanillaMasker.prototype.unMask = function() {
      this.unbindElementToMask();
    };
  
    var VMasker = function(el) {
      if (!el) {
        throw new Error("VanillaMasker: There is no element to bind.");
      }
      var elements = ("length" in el) ? (el.length ? el : []) : [el];
      return new VanillaMasker(elements);
    };
  
    VMasker.toMoney = function(value, opts) {
      opts = mergeMoneyOptions(opts);
      if (opts.zeroCents) {
        opts.lastOutput = opts.lastOutput || "";
        var zeroMatcher = ("("+ opts.separator +"[0]{0,"+ opts.precision +"})"),
            zeroRegExp = new RegExp(zeroMatcher, "g"),
            digitsLength = value.toString().replace(/[\D]/g, "").length || 0,
            lastDigitLength = opts.lastOutput.toString().replace(/[\D]/g, "").length || 0
        ;
        value = value.toString().replace(zeroRegExp, "");
        if (digitsLength < lastDigitLength) {
          value = value.slice(0, value.length - 1);
        }
      }
      var number = value.toString().replace(/[\D]/g, ""),
          clearDelimiter = new RegExp("^(0|\\"+ opts.delimiter +")"),
          clearSeparator = new RegExp("(\\"+ opts.separator +")$"),
          money = number.substr(0, number.length - opts.moneyPrecision),
          masked = money.substr(0, money.length % 3),
          cents = new Array(opts.precision + 1).join("0")
      ;
      money = money.substr(money.length % 3, money.length);
      for (var i = 0, len = money.length; i < len; i++) {
        if (i % 3 === 0) {
          masked += opts.delimiter;
        }
        masked += money[i];
      }
      masked = masked.replace(clearDelimiter, "");
      masked = masked.length ? masked : "0";
      if (!opts.zeroCents) {
        var beginCents = number.length - opts.precision,
            centsValue = number.substr(beginCents, opts.precision),
            centsLength = centsValue.length,
            centsSliced = (opts.precision > centsLength) ? opts.precision : centsLength
        ;
        cents = (cents + centsValue).slice(-centsSliced);
      }
      var output = opts.unit + masked + opts.separator + cents + opts.suffixUnit;
      return output.replace(clearSeparator, "");
    };
  
    VMasker.toPattern = function(value, opts) {
      var pattern = (typeof opts === 'object' ? opts.pattern : opts),
          patternChars = pattern.replace(/\W/g, ''),
          output = pattern.split(""),
          values = value.toString().replace(/\W/g, ""),
          charsValues = values.replace(/\W/g, ''),
          index = 0,
          i,
          outputLength = output.length,
          placeholder = (typeof opts === 'object' ? opts.placeholder : undefined)
      ;
      
      for (i = 0; i < outputLength; i++) {
        // Reached the end of input
        if (index >= values.length) {
          if (patternChars.length == charsValues.length) {
            return output.join("");
          }
          else if ((placeholder !== undefined) && (patternChars.length > charsValues.length)) {
            return addPlaceholdersToOutput(output, i, placeholder).join("");
          }
          else {
            break;
          }
        }
        // Remaining chars in input
        else{
          if ((output[i] === DIGIT && values[index].match(/[0-9]/)) ||
              (output[i] === ALPHA && values[index].match(/[a-zA-Z]/)) ||
              (output[i] === ALPHANUM && values[index].match(/[0-9a-zA-Z]/))) {
            output[i] = values[index++];
          } else if (output[i] === DIGIT || output[i] === ALPHA || output[i] === ALPHANUM) {
            if(placeholder !== undefined){
              return addPlaceholdersToOutput(output, i, placeholder).join("");
            }
            else{
              return output.slice(0, i).join("");
            }
          }
        }
      }
      return output.join("").substr(0, i);
    };
  
    VMasker.toNumber = function(value) {
      return value.toString().replace(/(?!^-)[^0-9]/g, "");
    };
    
    VMasker.toAlphaNumeric = function(value) {
      return value.toString().replace(/[^a-z0-9 ]+/i, "");
    };
  
    return VMasker;
  }));
  
  
  
  function inputChecker(){
  
    function inputHandler(masks, max, event) {
        const c = event.target;
        const v = c.value.replace(/\D/g, '');
        const m = c.value.length > max ? 1 : 0;
        VMasker(c).unMask();
        VMasker(c).maskPattern(masks[m]);
        c.value = VMasker.toPattern(v, masks[m]);
    }
  
    const fieldBustel = document.querySelector('#homePhone');
    const fieldTel = document.querySelector('#secundaryPhone');
  
    const telMask = ['(99) 9999-99999', '(99) 9 9999-9999'];
    VMasker(fieldTel).maskPattern(telMask[0]);
    VMasker(fieldBustel).maskPattern(telMask[0]);
    fieldTel.addEventListener('input', inputHandler.bind(undefined, telMask, 14), false);
    fieldBustel.addEventListener('input', inputHandler.bind(undefined, telMask, 14), false);
  
  
  
  
  
  
    const fieldDoc = document.querySelector('#corporateDocument');
  
    const docMask = ['999.999.999-999', '99.999.999/9999-99'];
    VMasker(fieldDoc).maskPattern(docMask[0]);
    fieldDoc.addEventListener('input', inputHandler.bind(undefined, docMask, 14), false);
  
  
  
  
  
  
    const fieldCep = document.querySelector('#postalCode');
  
    const cepMask = ['99999-999', '99999-999'];
    VMasker(fieldCep).maskPattern(cepMask[0]);
    fieldCep.addEventListener('input', inputHandler.bind(undefined, cepMask, 14), false);
  
  
  
  
  
  
  
    const stateRegistration = document.querySelector('#stateRegistration');
  
    const stateRegistrationMask = ['999.999.999.999', '999.999.999.999'];
    VMasker(stateRegistration).maskPattern(stateRegistrationMask[0]);
    stateRegistration.addEventListener('input', inputHandler.bind(undefined, stateRegistrationMask, 14), false);
  
  
  
  
  


    const RGfield = document.querySelector('#RG');
  
    const RGMask = ['99.999.999-9', '99.999.999-9'];
    VMasker(RGfield).maskPattern(RGMask[0]);
    RGfield.addEventListener('input', inputHandler.bind(undefined, RGMask, 14), false);
  




  
  
  
    const fieldCpf = document.querySelector('#document');
  
    const fieldCpfMask = ['999.999.999-99', '999.999.999-99'];
    VMasker(fieldCpf).maskPattern(fieldCpfMask[0]);
    fieldCpf.addEventListener('input', inputHandler.bind(undefined, fieldCpfMask, 14), false);
  
  
  
  
  
  
  
  
  
  
    const fieldNumber = document.querySelector('#number');
  
    const fieldNumberMask = ['99999', '99999'];
    VMasker(stateRegistration).maskPattern(stateRegistrationMask[0]);
    fieldNumber.addEventListener('input', inputHandler.bind(undefined, fieldNumberMask, 14), false);
  
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
//NOTIFICATIONS
const notifyElement = document.createElement('div');
notifyElement.setAttribute('class', 'notification-container');
document.querySelector('body').appendChild(notifyElement);

function notification() {
    function createNotification(element) {
        notifyElement.appendChild(element)
        setTimeout(function() {
            element.classList.add('out');
            setTimeout(function() {
                element.remove();
            }, 500)
        }, 5000)
    }

    return {
        success: function(msg) {
            const note = document.createElement('span');
            const icon = document.createElement('i');
            note.setAttribute('class', 'note-success');
            icon.setAttribute('class', 'fa fa-check-circle');
            note.textContent = msg
            note.appendChild(icon);
            createNotification(note)
        },
        alert: function(msg) {
            const note = document.createElement('span');
            const icon = document.createElement('i');
            note.setAttribute('class', 'note-alert');
            icon.setAttribute('class', 'fa fa-exclamation-triangle');
            note.textContent = msg
            note.appendChild(icon);
            createNotification(note)
        },
        error: function(msg) {
            const note = document.createElement('span');
            const icon = document.createElement('i');
            note.setAttribute('class', 'note-error');
            icon.setAttribute('class', 'fa fa-exclamation-circle');
            note.textContent = msg
            note.appendChild(icon);
            createNotification(note)
        }
    }
}
    
  
  
  
  
  
//CADASTRO FORM HIDDEN
document.querySelector('#cadastro-cadastrese').addEventListener("click",e=>{
    e.preventDefault();
    document.querySelector('.form-container').classList.add('cadastro-ativo')
})
  
//ANIMACAO PESSOA FISICA / JURIDICA
document.querySelectorAll('.pessoa-controls input').forEach(function(item){
    item.addEventListener('change',function(e){
        this.parentElement.parentElement.parentElement.setAttribute('class',e.target.id + " field tipo-pessoa")
    });
});
  
  

  
  
//FORM VALIDATION
function RequiredInputsFilled(){
let numberOfEmpty = 0;

    document.querySelectorAll('.field-required input')
        .forEach(item =>{
            if (item.value === ''){
                console.log(item);
                item.parentNode.classList.add("field-alert")
                
                numberOfEmpty++
            }else if(item.validity.typeMismatch){
                item.parentNode.classList.add("field-alert");
                notification().alert("Campo preenchido incorretamente");
            }
            else{
                item.parentNode.classList.remove("field-alert")
            }   
        })


return numberOfEmpty > 0 ? false : true
}
  
  
  
  
  
  
  
  

  
function CPFisfilled(){
    const corporateDocument = document.querySelector('#corporateDocument');
    const cpf = document.querySelector('#document');

    if (corporateDocument.value === "" && cpf.value === ""){
    notification().alert("Preencha o campo CPF ou CNPJ")
    return false

    }else{
    return true
    }
}
  
 

  
  function isentoState(){
    const isento = document.querySelector('#stateRegistrationIsento')
    const stateRegistration = document.querySelector('#stateRegistration');
  
    isento.checked = false;
    stateRegistration.value = ""
    stateRegistration.disabled = false
  
  
    isento.addEventListener(
      "change",()=>{
        if (isento.checked === true){
          stateRegistration.value = "Isento"
          stateRegistration.disabled = true;
          stateRegistration.style.color = "transparent"
        }else{
          stateRegistration.value = ""
          stateRegistration.disabled = false;
          stateRegistration.style.color = "black"
        }
      }
      )
  
  
  
  
  }
  
  
  function formToJson(form) {
    return Object.assign(...Array.from(new FormData(form).entries(), ([x, y]) => ({ [x]: y })))}
  
  function request(type, url, data) {
      return new Promise(function(resolve, reject) {
          const xhr = new XMLHttpRequest();
          xhr.open(type, url);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.onreadystatechange = function() {
              if (xhr.readyState === XMLHttpRequest.DONE) {
                  if (xhr.status === 200 || xhr.status === 201 || xhr.status === 304) {
                      return resolve({
                          statusCode: xhr.status,
                          data: xhr.responseText == "" ? "" : JSON.parse(xhr.responseText)
                      });
                  } else {
                      return reject(xhr);
                  }
              }
          }
          xhr.send(JSON.stringify(data));
      });
  }
  
  
function hiddenValues(){


      document.querySelector('#homePhone').value = "+55 " + document.querySelector('#homePhone').value.replace(/[{()}]/g, '').replace(/-/g, ' ');

      document.querySelector('#secundaryPhone').value = "+55 " + document.querySelector('#secundaryPhone').value.replace(/[{()}]/g, '').replace(/-/g, ' ');

      document.querySelector('#country').value = "BRA";

      document.querySelector('#document').value = document.querySelector('#document').value.replace(/[{.}]/g, '').replace(/-/g, '');

      document.querySelector('#corporateDocument').value = document.querySelector('#corporateDocument').value.replace(/[{.}]/g, '').replace(/-/g, '').replace(/[{/}]/g, '');

      document.querySelector('#receiverName').value = document.querySelector('#firstName').value + ' ' + document.querySelector('#firstName').value;

      document.querySelector('#addressName').value = "commercial";

      if (document.querySelector('#PF').checked){
        document.querySelector('#isCorporate').value = false;
        document.querySelector('#documentType').value = "CPF";
        document.querySelector('#addressType').value = "residential";
      }
      else if(document.querySelector('#PJ').checked){
        document.querySelector('#isCorporate').value = true;
        document.querySelector('#addressType').value = "commercial";
        document.querySelector('#businessPhone').value = document.querySelector('#homePhone').value
      }
  
      const isento = document.querySelector('#stateRegistrationIsento')
      if (isento.checked){
        isento.checked = false;
        document.querySelector('#stateRegistration').disabled = false;
        document.querySelector('#stateRegistration').style.color = "black"
      }
  

}

function clearInputs(){
  document.querySelectorAll('input, select').forEach(item => item.value = "");
}

  inputChecker();
  
  isentoState();
//   cpfCnpj();
  
  
  
  
  
  document.querySelector('form').addEventListener('submit', e=>{
    e.preventDefault();
    let formValidade = true;


    //VALIDACAO 
    document.querySelectorAll('.field-required input:not(.tipo-field)').forEach(function(item){
       if(!item.value.length){
            formValidade = false;
            notification().error('Corrigir campos vazios: '+item.previousSibling.textContent)
       };
    })
    

    if(!document.querySelector('input#PJ').checked && !document.querySelector('input#PF').checked){
        formValidade = false;
        notification().error('Você deve selecionar o tipo de pessoa.')
    }










    if(document.querySelector('input#PF').checked && (document.querySelector('input#document').value.length < 14)){
        formValidade = false;
        notification().error('Favor usar um CPF válido ');
    }

    if(document.querySelector('input#PJ').checked && (
      document.querySelector('input#corporateDocument').value.length < 18
       )

      ){
        formValidade = false;
        notification().error('Favor usar um CNPJ válido ');
    }




    if(document.querySelector('input#PF').checked && (document.querySelector('input#RG').value.length <= 0)){
        formValidade = false;
        notification().error('Favor preencher o RG ');
    }

    if(document.querySelector('input#PJ').checked && (
       document.querySelector('input#corporateName').value.length <= 0 || document.querySelector('input#CRMV').value.length <= 0 || document.querySelector('input#tradeName').value.length <= 0
       )

      ){
        formValidade = false;
        notification().error('Preencha os campos vazios em Pessoa Jurídica ');
    }





















    if(formValidade){

          hiddenValues();



        const data = formToJson(document.querySelector('form'));

        data.isNewsletterOptIn = document.querySelector('#isNewsletterOptIn').checked

        notification().success('Enviando dados, aguarde...')

        request('PATCH','/api/dataentities/CL/documents/',{
            CRMV: data.CRMV,
            RG: data.RG,
            businessPhone: data.businessPhone,
            corporateDocument: data.corporateDocument,
            corporateName: data.corporateName,
            document: data.document,
            documentType: data.documentType,
            email: data.email,
            firstName: data.firstName,
            homePhone: data.homePhone,
            isCorporate: data.isCorporate,
            isNewsletterOptIn: data.isNewsletterOptIn,
            lastName: data.isNewsletterOptIn,
            secundaryPhone: data.secundaryPhone,
            tradeName: data.tradeName
        })
      .then(
        resCL => { 
  
                console.log(resCL.statusCode);
  
  
          if (resCL.statusCode === 201 || resCL.statusCode === 200){
               request('PATCH','/api/dataentities/AD/documents/',{...data,userId:data.email})
               .then(resAD => {
                        console.log(resAD.statusCode);
  
                        if (resAD.statusCode === 201 || resAD.statusCode === 200){
                          notification().success("Cadastro realizado com sucesso")
                          clearInputs();
                        }else if(resAD.statusCode === 304){
                          notification().alert("Seu cadastro já foi enviado")
                        }else{
                          notification().error("Erro no cadastro")
                        }
                     })
                     .catch(err => notification().error(err))
  
          }else if(resCL.statusCode === 304){
            notification().alert("Seu cadastro já foi enviado")
          }else{
            notification().error("Erro no cadastro")
          }
        })
      .catch(err => {console.log(err); notification().error("Algo deu errado")})

        console.log(data)
    }



//     if (RequiredInputsFilled() && CPFisfilled() && isentoStateisfilled()){
  
  
//   //reativa field isento
//     document.querySelector('#stateRegistration').disabled = false;
//     document.querySelector('#stateRegistration').style.color = "black";  
//     document.querySelector('#stateRegistrationIsento').checked = false;
      
  
  
//   //valida newsletter check
//     console.log(  document.querySelector('#stateRegistration').value)  
//       
//         const form = 
  
  
  
      
        
//       
//       console.log(data);
  
      
  
  
//     }else{
//       notification().alert("Preencha todos os campos obrigatórios");
//           scroll(0,0);
  
//     }
  });
  
  