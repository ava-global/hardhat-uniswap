const { expect } = require("chai");
const { ethers } = require("hardhat");

const UniswapV2FactoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const UniswapV2PairArtifact = require('@uniswap/v2-core/build/UniswapV2Pair.json');
const UniswapV2Router02Artifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');


describe("Uniswap v2", function () {
  let totalSupply = ethers.utils.parseEther("1000000");
  let lpAmount = ethers.utils.parseEther("10000");
  let uniswapV2Factory;
  let uniswapV2Router02;
  let usdt;
  let busd;

  let owner;
  let addrs;

  describe("Deployment", function () {
    it("Should deploy smart contract successfully", async function () {
      // Get signers
      [owner, ...addrs] = await ethers.getSigners();

      // Deploy uniswap factory
      const UniswapV2Factory = await ethers.getContractFactory(
        UniswapV2FactoryArtifact.abi,
        UniswapV2FactoryArtifact.bytecode
      );
      uniswapV2Factory = await UniswapV2Factory.deploy(owner.address);

      // Deploy uniswap router
      const UniswapV2Router02 = await ethers.getContractFactory(
        UniswapV2Router02Artifact.abi,
        UniswapV2Router02Artifact.bytecode
      );
      uniswapV2Router02 = await UniswapV2Router02.deploy(uniswapV2Factory.address, owner.address);

      // Deploy usdt & busd

      const USDT = await ethers.getContractFactory("USDT");
      usdt = await USDT.deploy(totalSupply);

      const BUSD = await ethers.getContractFactory("BUSD");
      busd = await BUSD.deploy(totalSupply);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const usdtBalance = await usdt.balanceOf(owner.address);
      expect(await usdt.totalSupply()).to.equal(usdtBalance);

      const busdBalance = await busd.balanceOf(owner.address);
      expect(await busd.totalSupply()).to.equal(busdBalance);
    });
  });

  describe("Add Liquidity", function () {
    it("Should add USDT/BUSD LP Successfully", async function () {
      await usdt.approve(uniswapV2Router02.address, totalSupply, { from: owner.address });
      await busd.approve(uniswapV2Router02.address, totalSupply, { from: owner.address });

      await uniswapV2Router02.addLiquidity(
        usdt.address,
        busd.address,
        lpAmount,
        lpAmount,
        lpAmount,
        lpAmount,
        owner.address,
        Date.now() + 3600, { from: owner.address });
    });

    it("Should have correct reserve amount for both USDT/BUSD", async function () {
      pairAddress = await uniswapV2Factory.getPair(usdt.address, busd.address);
      const UniswapV2Pair = await ethers.getContractFactory(
        UniswapV2PairArtifact.abi,
        UniswapV2PairArtifact.bytecode
      );
      const uniswapV2Pair = UniswapV2Pair.attach(pairAddress);
      const reserves = await uniswapV2Pair.getReserves();
      const { 0: reserve0, 1: reserve1, } = reserves;

      expect(reserve0).to.equal(lpAmount);
      expect(reserve1).to.equal(lpAmount);
    });

  });

  describe("Swap", function () {

    it("Should swap exact USDT to BUSD successfully", async function () {
      const swapAmount = ethers.utils.parseEther("10");
      const minAmount = ethers.utils.parseEther("9");
      const expectedUsdtAmount = ethers.utils.parseEther("989990");
      const expectedBusdAmount = ethers.utils.parseEther("990009.960069810399032164");
      await uniswapV2Router02.swapExactTokensForTokens(
        swapAmount,
        minAmount,
        [usdt.address, busd.address],
        owner.address,
        Date.now() + 3600, { from: owner.address }
      )

      const usdtBalance = await usdt.balanceOf(owner.address);
      expect(expectedUsdtAmount).to.equal(usdtBalance);

      const busdBalance = await busd.balanceOf(owner.address);
      expect(expectedBusdAmount).to.equal(busdBalance);

    });

    it("Should swap USDT to exact BUSD successfully", async function () {
      const swapOutAmount = ethers.utils.parseEther("10");
      const maxInAmount = ethers.utils.parseEther("11");
      const expectedUsdtAmount = ethers.utils.parseEther("989979.939799408305065396");
      const expectedBusdAmount = ethers.utils.parseEther("990019.960069810399032164");
      await uniswapV2Router02.swapTokensForExactTokens(
        swapOutAmount,
        maxInAmount,
        [usdt.address, busd.address],
        owner.address,
        Date.now() + 3600, { from: owner.address }
      )

      const usdtBalance = await usdt.balanceOf(owner.address);
      expect(expectedUsdtAmount).to.equal(usdtBalance);

      const busdBalance = await busd.balanceOf(owner.address);
      expect(expectedBusdAmount).to.equal(busdBalance);
    });

  });
})
