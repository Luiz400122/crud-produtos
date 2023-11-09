// estrutura do projeto
const express = require("express");
//import fileupload
const fileupload = require("express-fileupload");

//import fs
const fs = require("fs");

const app = express();
//HABITAÇÃO DO UPLOAD
app.use(fileupload());
//bootstrap
app.use("/bootstrap", express.static("./node_modules/bootstrap/dist"));
//css
app.use("/css", express.static("./css"));

//referenciar pasta imagens
app.use("/imagens", express.static("./imagens"));

//configuração para informações json
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // para trabalhar com forms

//database
const db = require("./database/database");
//handlebars
const { engine } = require("express-handlebars");

//Config do dotenv
require("dotenv").config();
PORT = process.env.PORT;

//config handlebars
app.engine("handlebars", engine({
  helpers: {
    // Função auxiliar para verificar igualdade
    condicionalIgualdade: function (parametro1, parametro2, options) {
      return parametro1 === parametro2 ? options.fn(this) : options.inverse(this);
    }
  }
}));
app.set("view engine", "handlebars");
app.set("views", "./views");

//Root
app.get("/", (req, res) => {
  
    res.render("formulario");
  });


//ROTA PRNCIPAL COM SITUAÇÃO
app.get("/:situacao", (req, res) => {
 
    res.render("formulario", {
      //produtos: retorno,
      situacao: req.params.situacao,

  });
});


//Rota para pesquisa 

app.post('/pesquisa', function(req, res){
  //obter o termo pesquisado
  let termo = req.body.termo
  //sql

  let sql = `SELECT * FROM produtos WHERE nome LIKE '%${termo}%'`;

  db.query(sql, function(err, retorno){

    let semRegistro = retorno.length == 0 ? true : false;
    if (err) throw err;
    
      res.render('lista', {produtos:retorno, semRegistro: semRegistro})
  })
})

//listagem 
app.get('/listar/:categoria', (req, res)=>{
  //obter categoria
  let categoria = req.params.categoria

  //sql
  let sql = '';
  if(categoria == 'todos'){
    sql = 'SELECT * FROM produtos';
  }else{
    sql=`SELECT * FROM produtos WHERE categoria = '${categoria}'`;
  }
   //execution
   db.query(sql, function (err, retorno) {
    if (err) throw err;
    res.render("lista", { produtos: retorno });
  });

})


//cadastrar
app.post("/cadastrar", function (req, res) {
  try {
    let nome = req.body.nome;
    let valor = req.body.preco;
    let categoria = req.body.categoria
    let imagem = req.files.imagem.name;

    //validar produto e valor

    if (nome == "" || valor == "" || isNaN(valor) || categoria=='') {
      res.redirect("/falhaCadastro");
    } else {
      let sql = `INSERT INTO produtos (nome, valor, imagem, categoria ) VALUES ('${nome}', ${valor}, '${imagem}', '${categoria}')`;
      db.query(sql, function (retorno) {
        req.files.imagem.mv(__dirname + "/imagens/" + req.files.imagem.name);
      });
      res.redirect("/cadastrado");
    }
  } catch (erro) {
    res.redirect("/falhaCadastro");
  }
});

//deletar
app.get("/deletar/:codigo&:imagem", (req, res) => {
  // tratamento de exceção

  try {
    var codigo = req.params.codigo;

    let sql = `DELETE FROM produtos WHERE codigo =${codigo}`;

    db.query(sql, function () {
      console.log("produto apagado.");

      fs.unlink(__dirname + "/imagens/" + req.params.imagem, function () {
        console.log("imagem apagada.");
      });
    });
    res.redirect("/removido");
  } catch (erro) {
    res.redirect("/falhaAoRemover");
  }
});

//edição

app.get("/editar/:codigo", (req, res) => {
  let sql = `SELECT * FROM produtos WHERE codigo=${req.params.codigo}`;
  db.query(sql, (err, retorno) => {
    if (err) throw err;

    res.render("formUpdate", { produto: retorno[0] });
  });
});

//ROTA PARA ALTERAÇÃO DE PROSUTOS
app.post("/editar", (req, res) => {
  //OBTENÇÃO DADOS
  let codigo = req.body.codigo;
  var { nome, preco } = req.body;
  let nomeImagem = req.body.novaImagem;

  //validar nome do produto
  if (nome == "" || preco == "" || isNaN(preco)) {
    res.redirect("/falhaEdition");
  } else {
    try {
      //objeto imagem
      let imagem = req.files.imagem;
      let sql = `UPDATE produtos SET nome= '${nome}', valor='${preco}',imagem='${imagem.name}' WHERE codigo=${codigo}`;
      db.query(sql, function (err, retorno) {
        if (err) throw err;
        // remover imagem antiga
        fs.unlink(__dirname + "/imagens/" + nomeImagem, (error) => {
          console.log("falha ao remover" + error);
        });

        //cadastrar nova imagem
        imagem.mv(__dirname + "/imagens/" + imagem.name);
      });
    } catch (err) {
      let sql = `UPDATE produtos SET nome= '${nome}', valor='${preco}' WHERE codigo=${codigo}`;
      db.query(sql, (error) => {
        if (error) throw error;
      });
    }
    //redirecionamento
    res.redirect("/okEdition");
  }
});

//servidor
app.listen(PORT, () => {
  console.log("Server running at port " + PORT);
});
