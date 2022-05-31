//Constants
const express=require('express');
const bodyParser=require('body-parser');
const mysql=require('mysql');
const exphbs=require('express-handlebars');
const app=express();
const urlencoderParser=bodyParser.urlencoded({extended:false});
const alert = require("alert");
//Parametros para conexão com BD
const sql=mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'',
  port:3306
});
sql.query("use node_teste"); //Inicia o banco



//Template engine
app.engine("handlebars",exphbs.engine({defaultLayout:'main'}));
app.set('view engine','handlebars');
app.use('/img',express.static('img'));
app.use('/css',express.static('css'));

//Start server
app.listen(3000,function(req,res){
   console.log('Servidor está rodando!');
});

//Rotas
app.get("/",function(req,res){res.render('index');});
app.get("/inserir",function(req,res){res.render('inserir');});
app.get("/select",function(req,res){
  sql.query("select * from user order by id asc",function(err,results,fields){
    res.render('select',{data:results})
  });
});

//Inserir dados em inserir
app.post("/controllerForm",urlencoderParser,function(req,res){
  sql.query("insert into user (user_login, user_senha) values (?,?)",[req.body.login,req.body.senha]);
});



//-------------------------------Tela de vendas---------------------------------
app.get("/vendas",function(req,res){
  sql.query("select * from vendas_item where id_vendas is null;",function(err,vendas_results,fields){
    sql.query("select * from produtos order by id_produtos asc;",function(err,produtos_results,fields){
      sql.query("select * from clientes order by id_clientes asc;",function(err,clientes_results,fields){
        let totalVendas = 0;
        for(i in vendas_results){
          totalVendas += vendas_results[i].subtotal;
        }
        res.render("vendas",{data1:produtos_results,data2:clientes_results,data3:vendas_results,total:totalVendas.toFixed(2)});

      });
    });
  });
});

app.get("/deletaritemvenda/:id/:idp",function(req,res){
  let idVI = parseInt(req.params.id);
  let idPR = parseInt(req.params.idp);

  sql.query("select * from vendas_item where id_vendas_item=?",[idVI],function(err,iviResults,fields){
    sql.query("select * from produtos where id_produtos=?",[idPR],function(err,ipResults,fields){
      let change = (parseFloat(iviResults[0].quantidade)+parseFloat(ipResults[0].estoque));
      sql.query("update produtos set estoque=? where id_produtos=?",[change,idPR]);
      sql.query("delete from vendas_item where id_vendas_item=?",[idVI],function(err,results,fields){
        res.redirect('back');
      });
    });
  });


});



app.post("/addItem",urlencoderParser,function(req,res){
  let qtd =parseFloat(req.body.quantidade);
  let nomeProduto = req.body.item;
  let idProduto;
  let subtotal;

  sql.query("select * from produtos where nome_produto=?;",[nomeProduto],function(err,results,fields){
    if(qtd>results[0].estoque){
      alert("Estoque insuficiente")
    }else {
    subtotal = (qtd * results[0].preco_venda);
    let change = (results[0].estoque - qtd);
    sql.query("insert into vendas_item (quantidade,subtotal,id_produto,nome_produto) value(?,?,?,?)",[qtd,subtotal,results[0].id_produtos,nomeProduto],function(err,results2,fields){
      sql.query("update produtos set estoque=? where nome_produto=?",[change,nomeProduto]);
      res.redirect('back');
    });

    }
  });

});

app.post("/addVenda",urlencoderParser,function(req,res){
  sql.query("select id_clientes from clientes where nome_clientes=?",[req.body.cliv],function(err,results,fields){
    sql.query("insert into vendas (valor_total, id_clientes) value (?,?)",[parseFloat(req.body.totalVendas),results[0].id_clientes]);
    sql.query("select id_vendas from vendas order by id_vendas desc limit 1",function(err,venda_results,fields){
      sql.query("update vendas_item set id_vendas=? where id_vendas is null ",[venda_results[0].id_vendas]);
      res.redirect('back');
    });
  });
});
